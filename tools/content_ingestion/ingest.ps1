param(
    [switch]$MetadataOnly,
    [int]$CandidatesPerQuery = 100,
    [int]$RequestDelayMs = 250,
    [int]$MaxRetries = 4,
    [int]$InitialRetrySeconds = 5,
    [switch]$NoResume,
    [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$MetSearchUrl = "https://collectionapi.metmuseum.org/public/collection/v1.1/search"
$MetObjectUrl = "https://collectionapi.metmuseum.org/public/collection/v1/objects/{0}"
$MetLicenseUrl = "https://www.metmuseum.org/policies/image-resources"
$UserAgent = "PiecefulContentIngestion/0.2 (+https://github.com/eddy121384-ui/Pieceful)"
$FacetNames = @("subject", "region_culture", "mood", "visual", "style", "scene")
$RetryableStatusCodes = @(403, 429, 500, 502, 503, 504)

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PlanPath = Join-Path $PSScriptRoot "sample_plan_v0.json"
$StagingRoot = Join-Path $RepoRoot ".pieceful-content"
$ManifestDir = Join-Path $StagingRoot "manifests"

function New-MetSearchUrl([string]$Query, [int]$Limit) {
    $encoded = [uri]::EscapeDataString($Query)
    return "${MetSearchUrl}?q=${encoded}&hasImages=true&limit=${Limit}&offset=0"
}

function Get-HttpStatusCode($ErrorRecord) {
    try {
        if ($null -ne $ErrorRecord.Exception.Response -and
            $null -ne $ErrorRecord.Exception.Response.StatusCode) {
            return [int]$ErrorRecord.Exception.Response.StatusCode
        }
    }
    catch {}
    return $null
}

function Get-RetryDelaySeconds([int]$Attempt) {
    $delay = [int]($InitialRetrySeconds * [math]::Pow(2, $Attempt))
    return [math]::Min(60, [math]::Max(1, $delay))
}

function Convert-Utf8JsonBytes([byte[]]$Bytes) {
    $text = [System.Text.Encoding]::UTF8.GetString($Bytes)
    return $text | ConvertFrom-Json
}

function Get-Json([string]$Url) {
    for ($attempt = 0; $attempt -le $MaxRetries; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -Headers @{
                "User-Agent" = $UserAgent
                "Accept" = "application/json"
            } -TimeoutSec 30

            $stream = $response.RawContentStream
            $stream.Position = 0
            $memory = New-Object System.IO.MemoryStream
            try {
                $stream.CopyTo($memory)
                return Convert-Utf8JsonBytes $memory.ToArray()
            }
            finally {
                $memory.Dispose()
            }
        }
        catch {
            $status = Get-HttpStatusCode $_
            $canRetry = ($attempt -lt $MaxRetries) -and ($RetryableStatusCodes -contains $status)
            if (-not $canRetry) {
                throw
            }
            $delay = Get-RetryDelaySeconds $attempt
            Write-Warning "The Met returned HTTP $status. Cooling down for $delay second(s), then retrying ($($attempt + 1)/$MaxRetries)..."
            Start-Sleep -Seconds $delay
        }
    }
}

function Download-File([string]$Url, [string]$Destination) {
    $parent = Split-Path -Parent $Destination
    New-Item -ItemType Directory -Force -Path $parent | Out-Null

    if ((Test-Path $Destination) -and (Get-Item $Destination).Length -gt 0) {
        return
    }

    $tmp = "$Destination.tmp"
    try {
        for ($attempt = 0; $attempt -le $MaxRetries; $attempt++) {
            try {
                Invoke-WebRequest -Uri $Url -OutFile $tmp -UseBasicParsing -Headers @{
                    "User-Agent" = $UserAgent
                } -TimeoutSec 60
                if (-not (Test-Path $tmp) -or (Get-Item $tmp).Length -le 0) {
                    throw "Downloaded file is empty: $Url"
                }
                Move-Item -Force $tmp $Destination
                return
            }
            catch {
                if (Test-Path $tmp) {
                    Remove-Item -Force $tmp -ErrorAction SilentlyContinue
                }
                $status = Get-HttpStatusCode $_
                $canRetry = ($attempt -lt $MaxRetries) -and ($RetryableStatusCodes -contains $status)
                if (-not $canRetry) {
                    throw
                }
                $delay = Get-RetryDelaySeconds $attempt
                Write-Warning "Image server returned HTTP $status. Cooling down for $delay second(s), then retrying ($($attempt + 1)/$MaxRetries)..."
                Start-Sleep -Seconds $delay
            }
        }
    }
    finally {
        if (Test-Path $tmp) {
            Remove-Item -Force $tmp -ErrorAction SilentlyContinue
        }
    }
}

function New-UnresolvedFacetStatus {
    $status = [ordered]@{}
    foreach ($facet in $FacetNames) {
        $status[$facet] = "unresolved"
    }
    return [pscustomobject]$status
}

function Convert-MetObject($Payload) {
    if ($null -eq $Payload.objectID -or [int]$Payload.objectID -le 0) {
        return $null
    }
    if ($Payload.isPublicDomain -ne $true) {
        return $null
    }

    $objectId = [int]$Payload.objectID
    $gameUrl = [string]$Payload.primaryImageSmall
    $originalUrl = [string]$Payload.primaryImage
    if ([string]::IsNullOrWhiteSpace($gameUrl)) {
        $gameUrl = $originalUrl
    }
    if ([string]::IsNullOrWhiteSpace($gameUrl)) {
        return $null
    }

    $title = [string]$Payload.title
    if ([string]::IsNullOrWhiteSpace($title)) {
        $title = "Met object $objectId"
    }

    $creator = [string]$Payload.artistDisplayName
    if ([string]::IsNullOrWhiteSpace($creator)) {
        $creator = "Unknown / not supplied by source"
    }

    $sourceUrl = [string]$Payload.objectURL
    if ([string]::IsNullOrWhiteSpace($sourceUrl)) {
        $sourceUrl = "https://www.metmuseum.org/art/collection/search/$objectId"
    }

    return [pscustomobject][ordered]@{
        id = "met_$objectId"
        provider = "met"
        source_item_id = [string]$objectId
        title = $title
        creator = $creator
        source_url = $sourceUrl
        rights = [pscustomobject][ordered]@{
            license = "cc0"
            license_url = $MetLicenseUrl
            commercial_use_allowed = $true
            attribution_required = $false
            provider_rights_signal = [pscustomobject][ordered]@{
                field = "isPublicDomain"
                value = $true
            }
        }
        asset = [pscustomobject][ordered]@{
            remote_original_url = $originalUrl
            remote_game_candidate_url = $gameUrl
            local_game_candidate_path = ""
        }
        source_metadata_encoding = "utf8_v1"
        source_metadata = [pscustomobject][ordered]@{
            artist_display_name = [string]$Payload.artistDisplayName
            artist_nationality = [string]$Payload.artistNationality
            culture = [string]$Payload.culture
            object_date = [string]$Payload.objectDate
            medium = [string]$Payload.medium
            classification = [string]$Payload.classification
            department = [string]$Payload.department
            credit_line = [string]$Payload.creditLine
            object_name = [string]$Payload.objectName
        }
        taxonomy_draft = [pscustomobject][ordered]@{
            status = "unresolved"
            category = $null
            subject = @()
            region_culture = @()
            mood = @()
            visual = @()
            style = @()
            scene = @()
            facet_status = New-UnresolvedFacetStatus
            puzzleability = $null
            suggested_difficulty = $null
        }
    }
}

if ($CandidatesPerQuery -lt 1 -or $CandidatesPerQuery -gt 500) {
    throw "CandidatesPerQuery must be between 1 and 500."
}
if ($RequestDelayMs -lt 0) {
    throw "RequestDelayMs cannot be negative."
}
if ($MaxRetries -lt 0 -or $MaxRetries -gt 10) {
    throw "MaxRetries must be between 0 and 10."
}
if ($InitialRetrySeconds -lt 1 -or $InitialRetrySeconds -gt 60) {
    throw "InitialRetrySeconds must be between 1 and 60."
}

if ($SelfTest) {
    $testUrl = New-MetSearchUrl -Query "still life" -Limit 100
    $testUri = [uri]$testUrl
    if ($testUri.Scheme -ne "https" -or $testUri.Host -ne "collectionapi.metmuseum.org") {
        throw "Met search URL self-test produced an invalid host: $testUrl"
    }
    if ($testUrl -notmatch "q=still%20life" -or $testUrl -notmatch "limit=100") {
        throw "Met search URL self-test produced an invalid query: $testUrl"
    }
    if ((Get-RetryDelaySeconds 0) -lt 1 -or (Get-RetryDelaySeconds 10) -gt 60) {
        throw "Retry backoff self-test failed."
    }

    $utf8Fixture = '{"title":"Koto (箏)","date":"1489–90","creator":"Louis-Rémy"}'
    $utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($utf8Fixture)
    $decodedFixture = Convert-Utf8JsonBytes $utf8Bytes
    if ($decodedFixture.title -ne "Koto (箏)" -or
        $decodedFixture.date -ne "1489–90" -or
        $decodedFixture.creator -ne "Louis-Rémy") {
        throw "UTF-8 JSON self-test failed."
    }

    Write-Host "PASS PowerShell ingestion self-test: URL construction, retry backoff, and UTF-8 JSON decoding validated."
    exit 0
}

if (-not (Test-Path $PlanPath)) {
    throw "Sample plan not found: $PlanPath"
}

$plan = Get-Content -Raw -Encoding UTF8 $PlanPath | ConvertFrom-Json
if ($plan.provider -ne "met") {
    throw "Content Ingestion v0 currently implements provider=met only."
}

$expectedTotal = 0
foreach ($row in $plan.queries) {
    $expectedTotal += [int]$row.target
}

New-Item -ItemType Directory -Force -Path $StagingRoot | Out-Null
New-Item -ItemType Directory -Force -Path $ManifestDir | Out-Null

$entries = New-Object System.Collections.ArrayList
$queryResults = New-Object System.Collections.ArrayList
$seenIds = New-Object 'System.Collections.Generic.HashSet[string]'
$seenAssetUrls = New-Object 'System.Collections.Generic.HashSet[string]'

if (-not $NoResume) {
    $latestManifest = Get-ChildItem -Path $ManifestDir -Filter "met_sample_*.json" -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1

    if ($null -ne $latestManifest) {
        try {
            $previous = Get-Content -Raw -Encoding UTF8 $latestManifest.FullName | ConvertFrom-Json
            if ($previous.kind -eq "pieceful_content_ingestion_manifest" -and $previous.provider -eq "met") {
                foreach ($entry in @($previous.entries)) {
                    if ($null -eq $entry -or [string]::IsNullOrWhiteSpace([string]$entry.id)) {
                        continue
                    }

                    $keepEntry = $true
                    if (-not $MetadataOnly) {
                        $relativePath = [string]$entry.asset.local_game_candidate_path
                        if ([string]::IsNullOrWhiteSpace($relativePath)) {
                            $keepEntry = $false
                        }
                        else {
                            $localPath = Join-Path $StagingRoot ($relativePath -replace "/", "\")
                            $keepEntry = (Test-Path $localPath) -and ((Get-Item $localPath).Length -gt 0)
                        }
                    }

                    $assetUrl = [string]$entry.asset.remote_game_candidate_url
                    if ([string]::IsNullOrWhiteSpace($assetUrl)) {
                        $keepEntry = $false
                    }

                    if ($keepEntry -and
                        -not $seenAssetUrls.Contains($assetUrl)) {

                        $resumeEntry = $entry
                        if ([string]$entry.source_metadata_encoding -ne "utf8_v1") {
                            try {
                                if ($RequestDelayMs -gt 0) {
                                    Start-Sleep -Milliseconds $RequestDelayMs
                                }
                                $payload = Get-Json ($MetObjectUrl -f $entry.source_item_id)
                                $refreshed = Convert-MetObject $payload
                                if ($null -ne $refreshed) {
                                    $refreshed.asset.local_game_candidate_path = [string]$entry.asset.local_game_candidate_path
                                    $refreshed | Add-Member -NotePropertyName ingestion_query -NotePropertyValue ([string]$entry.ingestion_query)
                                    $resumeEntry = $refreshed
                                    Write-Host "  refreshed UTF-8 metadata for $($entry.id)" -ForegroundColor DarkGray
                                }
                            }
                            catch {
                                Write-Warning "Could not refresh metadata for $($entry.id); keeping resumed metadata: $($_.Exception.Message)"
                            }
                        }

                        if ($seenIds.Add([string]$resumeEntry.id)) {
                            $null = $seenAssetUrls.Add([string]$resumeEntry.asset.remote_game_candidate_url)
                            $null = $entries.Add($resumeEntry)
                        }
                    }
                }

                if ($entries.Count -gt 0) {
                    Write-Host "Resuming from $($latestManifest.Name) with $($entries.Count)/$expectedTotal accepted item(s)." -ForegroundColor Yellow
                }
            }
        }
        catch {
            Write-Warning "Could not resume from $($latestManifest.Name): $($_.Exception.Message)"
        }
    }
}

foreach ($row in $plan.queries) {
    $query = [string]$row.query
    $target = [int]$row.target
    $acceptedBefore = @($entries | Where-Object { [string]$_.ingestion_query -eq $query }).Count
    $accepted = $acceptedBefore
    $inspected = 0
    $errors = 0

    Write-Host ""
    Write-Host "Searching The Met: $query (target $target, already have $acceptedBefore)" -ForegroundColor Cyan

    if ($accepted -ge $target) {
        Write-Host "  already complete; skipping API search." -ForegroundColor DarkGray
        $null = $queryResults.Add([pscustomobject]@{
            query = $query
            target = $target
            accepted = $accepted
            resumed = $acceptedBefore
            newly_accepted = 0
            inspected = 0
            errors = 0
        })
        continue
    }

    $searchUrl = New-MetSearchUrl -Query $query -Limit $CandidatesPerQuery

    try {
        $search = Get-Json $searchUrl
        $objectIds = @($search.objectIDs)
    }
    catch {
        Write-Warning "Search failed for '$query': $($_.Exception.Message)"
        $null = $queryResults.Add([pscustomobject]@{
            query = $query
            target = $target
            accepted = $accepted
            resumed = $acceptedBefore
            newly_accepted = 0
            inspected = 0
            errors = 1
        })
        continue
    }

    foreach ($objectId in $objectIds) {
        if ($accepted -ge $target) { break }
        if ($null -eq $objectId) { continue }

        $candidateId = "met_$objectId"
        if ($seenIds.Contains($candidateId)) { continue }

        $inspected++
        if ($RequestDelayMs -gt 0) {
            Start-Sleep -Milliseconds $RequestDelayMs
        }

        try {
            $payload = Get-Json ($MetObjectUrl -f $objectId)
            $candidate = Convert-MetObject $payload
        }
        catch {
            $errors++
            Write-Warning "Object $objectId failed: $($_.Exception.Message)"
            continue
        }

        if ($null -eq $candidate) { continue }

        $candidateAssetUrl = [string]$candidate.asset.remote_game_candidate_url
        if ($seenAssetUrls.Contains($candidateAssetUrl)) {
            Write-Host "  skipped duplicate image asset for $candidateId" -ForegroundColor DarkGray
            continue
        }

        $relativePath = "processed/met/$candidateId.jpg"
        $candidate.asset.local_game_candidate_path = $relativePath
        $candidate | Add-Member -NotePropertyName ingestion_query -NotePropertyValue $query

        if (-not $MetadataOnly) {
            try {
                $destination = Join-Path $StagingRoot ($relativePath -replace "/", "\")
                Download-File $candidate.asset.remote_game_candidate_url $destination
            }
            catch {
                $errors++
                Write-Warning "Image $candidateId failed: $($_.Exception.Message)"
                continue
            }
        }

        $null = $seenIds.Add($candidateId)
        $null = $seenAssetUrls.Add($candidateAssetUrl)
        $null = $entries.Add($candidate)
        $accepted++
        Write-Host "  accepted $candidateId : $($candidate.title)" -ForegroundColor Green
    }

    $null = $queryResults.Add([pscustomobject]@{
        query = $query
        target = $target
        accepted = $accepted
        resumed = $acceptedBefore
        newly_accepted = ($accepted - $acceptedBefore)
        inspected = $inspected
        errors = $errors
    })
}

$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$manifestPath = Join-Path $ManifestDir "met_sample_$stamp.json"

$manifest = [pscustomobject][ordered]@{
    schema_version = 1
    kind = "pieceful_content_ingestion_manifest"
    provider = "met"
    generated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    taxonomy_status = "authoring_unresolved"
    download_mode = $(if ($MetadataOnly) { "metadata_only" } else { "game_candidate" })
    plan_version = [int]$plan.plan_version
    expected_total = $expectedTotal
    accepted_total = $entries.Count
    complete = ($entries.Count -ge $expectedTotal)
    query_results = @($queryResults)
    entries = @($entries)
}

$manifestJson = $manifest | ConvertTo-Json -Depth 12
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText(
    $manifestPath,
    $manifestJson + [Environment]::NewLine,
    $utf8NoBom
)

Write-Host ""
Write-Host "Wrote $($entries.Count)/$expectedTotal entries to:" -ForegroundColor Cyan
Write-Host "  $manifestPath"

if ($entries.Count -eq 0) {
    Write-Error "No rights-safe image candidates were accepted."
    exit 3
}

if ($entries.Count -lt $expectedTotal) {
    Write-Warning "Partial ingestion: $($entries.Count)/$expectedTotal accepted. Wait a little, then run the launcher again; it will resume instead of starting over."
    exit 4
}

Write-Host ""
Write-Host "Content ingestion completed: $($entries.Count)/$expectedTotal accepted." -ForegroundColor Green
exit 0
