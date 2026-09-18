param(
    [switch]$MetadataOnly,
    [int]$CandidatesPerQuery = 100,
    [int]$RequestDelayMs = 50
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$MetSearchUrl = "https://collectionapi.metmuseum.org/public/collection/v1.1/search"
$MetObjectUrl = "https://collectionapi.metmuseum.org/public/collection/v1/objects/{0}"
$MetLicenseUrl = "https://www.metmuseum.org/policies/image-resources"
$UserAgent = "PiecefulContentIngestion/0.1 (+https://github.com/eddy121384-ui/Pieceful)"
$FacetNames = @("subject", "region_culture", "mood", "visual", "style", "scene")

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PlanPath = Join-Path $PSScriptRoot "sample_plan_v0.json"
$StagingRoot = Join-Path $RepoRoot ".pieceful-content"

function Get-Json([string]$Url) {
    return Invoke-RestMethod -Uri $Url -Headers @{
        "User-Agent" = $UserAgent
        "Accept" = "application/json"
    } -TimeoutSec 30
}

function Download-File([string]$Url, [string]$Destination) {
    $parent = Split-Path -Parent $Destination
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    $tmp = "$Destination.tmp"
    try {
        Invoke-WebRequest -Uri $Url -OutFile $tmp -UseBasicParsing -Headers @{
            "User-Agent" = $UserAgent
        } -TimeoutSec 60
        if (-not (Test-Path $tmp) -or (Get-Item $tmp).Length -le 0) {
            throw "Downloaded file is empty: $Url"
        }
        Move-Item -Force $tmp $Destination
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
if (-not (Test-Path $PlanPath)) {
    throw "Sample plan not found: $PlanPath"
}

$plan = Get-Content -Raw -Encoding UTF8 $PlanPath | ConvertFrom-Json
if ($plan.provider -ne "met") {
    throw "Content Ingestion v0 currently implements provider=met only."
}

New-Item -ItemType Directory -Force -Path $StagingRoot | Out-Null
$entries = New-Object System.Collections.ArrayList
$queryResults = New-Object System.Collections.ArrayList
$seenIds = New-Object 'System.Collections.Generic.HashSet[string]'

foreach ($row in $plan.queries) {
    $query = [string]$row.query
    $target = [int]$row.target
    $accepted = 0
    $inspected = 0
    $errors = 0

    Write-Host ""
    Write-Host "Searching The Met: $query (target $target)" -ForegroundColor Cyan

    $encoded = [uri]::EscapeDataString($query)
    $searchUrl = "$MetSearchUrl?q=$encoded&hasImages=true&limit=$CandidatesPerQuery&offset=0"

    try {
        $search = Get-Json $searchUrl
        $objectIds = @($search.objectIDs)
    }
    catch {
        Write-Warning "Search failed for '$query': $($_.Exception.Message)"
        $null = $queryResults.Add([pscustomobject]@{
            query = $query; target = $target; accepted = 0; inspected = 0; errors = 1
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
        $null = $entries.Add($candidate)
        $accepted++
        Write-Host "  accepted $candidateId : $($candidate.title)" -ForegroundColor Green
    }

    $null = $queryResults.Add([pscustomobject]@{
        query = $query
        target = $target
        accepted = $accepted
        inspected = $inspected
        errors = $errors
    })
}

$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$manifestDir = Join-Path $StagingRoot "manifests"
New-Item -ItemType Directory -Force -Path $manifestDir | Out-Null
$manifestPath = Join-Path $manifestDir "met_sample_$stamp.json"

$manifest = [pscustomobject][ordered]@{
    schema_version = 1
    kind = "pieceful_content_ingestion_manifest"
    provider = "met"
    generated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    taxonomy_status = "authoring_unresolved"
    download_mode = $(if ($MetadataOnly) { "metadata_only" } else { "game_candidate" })
    plan_version = [int]$plan.plan_version
    query_results = @($queryResults)
    entries = @($entries)
}

$manifest | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 $manifestPath

Write-Host ""
Write-Host "Wrote $($entries.Count) entries to:" -ForegroundColor Cyan
Write-Host "  $manifestPath"

if ($entries.Count -eq 0) {
    throw "No rights-safe image candidates were accepted."
}

Write-Host ""
Write-Host "Content ingestion finished successfully." -ForegroundColor Green
