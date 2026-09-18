param(
  [string]$ManifestPath = "",
  [string]$StagingRoot = ".pieceful-content",
  [string]$TaxonomyPath = "content\tag_taxonomy_v1.json",
  [string]$OutputPath = "",
  [string]$Model = "",
  [ValidateSet("low","high","auto")][string]$ImageDetail = "low",
  [double]$ReviewThreshold = 0.72,
  [int]$MaxItems = 0,
  [switch]$DryRun,
  [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ApiUrl = "https://api.openai.com/v1/responses"
$Facets = @("subject","region_culture","mood","visual","style","scene")
$ConfidenceFields = @("overall","category","subject","region_culture","mood","visual","style","scene")
$Canonical = '^[a-z0-9]+(?:_[a-z0-9]+)*$'

function Read-Json($p) { Get-Content -Raw -Encoding UTF8 $p | ConvertFrom-Json }
function Write-Json($v,$p) {
  $dir = Split-Path -Parent $p; if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $enc = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($p, (($v | ConvertTo-Json -Depth 24) + [Environment]::NewLine), $enc)
}
function UtcNow { (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
function P($o,$n) { if ($null -eq $o) { return $null }; $x=$o.PSObject.Properties[$n]; if ($x) { $x.Value } else { $null } }
function Clone($o) { (($o | ConvertTo-Json -Depth 24) | ConvertFrom-Json) }

$taxonomyFile = [IO.Path]::GetFullPath($TaxonomyPath)
if (-not (Test-Path $taxonomyFile)) { throw "Taxonomy not found: $taxonomyFile" }
$tax = Read-Json $taxonomyFile

function ArrSchema($max,$enum=$null) {
  $item=[ordered]@{type="string"}; if ($null -ne $enum) { $item.enum=@($enum) }
  [ordered]@{type="array";items=$item;maxItems=[int]$max}
}
function ResultSchema {
  $statusProps=[ordered]@{}; foreach($f in $Facets){$statusProps[$f]=[ordered]@{type="string";enum=@("present","not_applicable","unresolved")}}
  $confProps=[ordered]@{}; foreach($f in $ConfidenceFields){$confProps[$f]=[ordered]@{type="number";minimum=0;maximum=1}}
  $tp=[ordered]@{
    category=[ordered]@{type="string";enum=@($tax.primary_categories)}
    subject=ArrSchema $tax.facet_rules.subject.max_values
    region_culture=ArrSchema $tax.facet_rules.region_culture.max_values
    mood=ArrSchema $tax.facet_rules.mood.max_values @($tax.controlled_values.mood)
    visual=ArrSchema $tax.facet_rules.visual.max_values @($tax.controlled_values.visual)
    style=ArrSchema $tax.facet_rules.style.max_values @($tax.controlled_values.style)
    scene=ArrSchema $tax.facet_rules.scene.max_values @($tax.controlled_values.scene)
    facet_status=[ordered]@{type="object";properties=$statusProps;required=$Facets;additionalProperties=$false}
  }
  [ordered]@{type="object";properties=[ordered]@{
    taxonomy=[ordered]@{type="object";properties=$tp;required=@("category","subject","region_culture","mood","visual","style","scene","facet_status");additionalProperties=$false}
    confidence=[ordered]@{type="object";properties=$confProps;required=$ConfidenceFields;additionalProperties=$false}
    review_required=[ordered]@{type="boolean"}
    review_reasons=[ordered]@{type="array";items=[ordered]@{type="string"};maxItems=8}
    rationale=[ordered]@{type="string"}
  };required=@("taxonomy","confidence","review_required","review_reasons","rationale");additionalProperties=$false}
}

function Validate-Result($r) {
  $err=New-Object Collections.ArrayList
  if (@($tax.primary_categories) -notcontains [string]$r.taxonomy.category) { $null=$err.Add("bad category") }
  foreach($f in @("subject","region_culture")) {
    $max=[int](P (P $tax.facet_rules $f) "max_values"); foreach($v in @((P $r.taxonomy $f))){if([string]$v -notmatch $Canonical){$null=$err.Add("$f '$v' is not lower_snake_case_ascii")}}
    if(@((P $r.taxonomy $f)).Count -gt $max){$null=$err.Add("$f too long")}
  }
  foreach($f in @("mood","visual","style","scene")) {
    $rule=P $tax.facet_rules $f; $allowed=@(P $tax.controlled_values $f); $vals=@(P $r.taxonomy $f)
    if($vals.Count -gt [int]$rule.max_values){$null=$err.Add("$f too long")}; foreach($v in $vals){if($allowed -notcontains [string]$v){$null=$err.Add("bad $f '$v'")}}
  }
  foreach($f in $Facets){$s=[string](P $r.taxonomy.facet_status $f);$vals=@(P $r.taxonomy $f);if(@("present","not_applicable","unresolved") -notcontains $s){$null=$err.Add("bad status $f")};if($s -eq "present" -and $vals.Count -eq 0){$null=$err.Add("$f present but empty")};if($s -ne "present" -and $vals.Count -gt 0){$null=$err.Add("$f status=$s but nonempty")}}
  foreach($f in $ConfidenceFields){$v=[double](P $r.confidence $f);if($v -lt 0 -or $v -gt 1){$null=$err.Add("bad confidence $f")}}
  @($err)
}

if ($SelfTest) {
  $s=ResultSchema; if(@($s.properties.taxonomy.properties.category.enum).Count -ne @($tax.primary_categories).Count){throw "schema mismatch"}
  $fixture=[pscustomobject]@{taxonomy=[pscustomobject]@{category="art_culture";subject=@("animal","statuette");region_culture=@("coptic");mood=@();visual=@("clear_regions");style=@("photo");scene=@();facet_status=[pscustomobject]@{subject="present";region_culture="present";mood="not_applicable";visual="present";style="present";scene="not_applicable"}};confidence=[pscustomobject]@{overall=.9;category=.9;subject=.9;region_culture=.9;mood=.9;visual=.9;style=.9;scene=.9};review_required=$false;review_reasons=@();rationale="fixture"}
  if(@(Validate-Result $fixture).Count -ne 0){throw "valid fixture rejected"};$fixture.taxonomy.scene=@("moonlight");$fixture.taxonomy.facet_status.scene="present";if(@(Validate-Result $fixture).Count -eq 0){throw "invalid fixture accepted"}
  Write-Host "PASS Vision Tagging v0 self-test"; exit 0
}

$staging=[IO.Path]::GetFullPath($StagingRoot)
if (-not $ManifestPath) {
  $candidate=Get-ChildItem (Join-Path $staging "manifests") -Filter "met_sample_*.json" -File | Sort-Object LastWriteTimeUtc -Descending | Where-Object { try{(Read-Json $_.FullName).complete -eq $true}catch{$false} } | Select-Object -First 1
  if(-not $candidate){throw "No complete manifest found"};$ManifestPath=$candidate.FullName
}
$manifestFile=[IO.Path]::GetFullPath($ManifestPath);$manifest=Read-Json $manifestFile;if($manifest.complete -ne $true){throw "Manifest is incomplete"}
if(-not $Model){$Model=$env:PIECEFUL_VISION_MODEL};if(-not $Model){$Model="gpt-5.6-luna"}
if(-not $OutputPath){$OutputPath=Join-Path (Join-Path $staging "tagging") (([IO.Path]::GetFileNameWithoutExtension($manifestFile))+"_vision_v0.json")};$outFile=[IO.Path]::GetFullPath($OutputPath)

function Prompt($e) {
  $ctx=[ordered]@{id=$e.id;title=$e.title;creator=$e.creator;ingestion_query=$e.ingestion_query;source_metadata=[ordered]@{culture=$e.source_metadata.culture;artist_nationality=$e.source_metadata.artist_nationality;classification=$e.source_metadata.classification;object_name=$e.source_metadata.object_name;medium=$e.source_metadata.medium;department=$e.source_metadata.department}} | ConvertTo-Json -Depth 5 -Compress
@"
Classify this puzzle image using Pieceful taxonomy. Inspect the image itself.
Rules: ingestion_query is noisy discovery provenance, never taxonomy truth. Category follows the primary visual/semantic experience. Museum artifacts/decorative art/sculpture/textiles/jewelry/weapons/instruments usually use art_culture when cultural/artistic character is primary; an animal motif belongs in subject and does not imply category=animals. Scene is visual: words like Night Table/Night cap do not imply scene=night. region_culture may use explicit museum culture/place evidence, but artist nationality alone is insufficient. Use not_applicable when a facet does not meaningfully apply and unresolved when genuinely uncertain. Flat reproductions should use their artwork medium (painting/print/etc.); catalog photos of 3D artifacts may use photo. Neutral documentation imagery may have mood not_applicable. subject and region_culture must be lower_snake_case_ascii. Never infer rights. Mark review_required for ambiguity or weak evidence.
Supporting source context (not ground truth): $ctx
"@
}
function DataUrl($p){$ext=[IO.Path]::GetExtension($p).ToLower();$mime=if($ext -in @(".jpg",".jpeg")){"image/jpeg"}elseif($ext -eq ".png"){"image/png"}elseif($ext -eq ".webp"){"image/webp"}else{throw "Unsupported image $ext"};"data:$mime;base64,$([Convert]::ToBase64String([IO.File]::ReadAllBytes($p)))"}
function Body($e,$url){[ordered]@{model=$Model;input=@([ordered]@{role="user";content=@([ordered]@{type="input_text";text=(Prompt $e)},[ordered]@{type="input_image";image_url=$url;detail=$ImageDetail})});text=[ordered]@{format=[ordered]@{type="json_schema";name="pieceful_vision_tagging_v0";description="Pieceful taxonomy proposal";schema=(ResultSchema);strict=$true}};max_output_tokens=2200}}
function Api($body,$key){$bytes=[Text.Encoding]::UTF8.GetBytes(($body|ConvertTo-Json -Depth 30 -Compress));for($a=0;$a -le 4;$a++){try{return Invoke-RestMethod $ApiUrl -Method Post -Headers @{Authorization="Bearer $key"} -ContentType "application/json; charset=utf-8" -Body $bytes -TimeoutSec 120}catch{$code=$null;try{$code=[int]$_.Exception.Response.StatusCode}catch{};if($a -ge 4 -or @(408,409,429,500,502,503,504) -notcontains $code){throw};Start-Sleep -Seconds ([math]::Min(30,[int](2*[math]::Pow(2,$a))))}}}
function OutputText($r){if((P $r "output_text")){return [string](P $r "output_text")};foreach($i in @($r.output)){foreach($c in @($i.content)){if($c.type -eq "output_text" -and $c.text){return [string]$c.text}}};throw "No output_text returned"}
function ManualLocked($e){$d=$e.taxonomy_draft;((P $d "manual_override") -eq $true)-or((P $d "locked") -eq $true)-or([string](P $d "authority") -eq "manual")-or([string](P (P $d "provenance") "authority") -eq "manual")}

$out=if(Test-Path $outFile){try{$x=Read-Json $outFile;if($x.kind -eq "pieceful_vision_tagging_manifest" -and $x.source_manifest -eq $manifestFile){$x}else{$null}}catch{$null}}else{$null}
if(-not $out){$out=[pscustomobject][ordered]@{schema_version=1;kind="pieceful_vision_tagging_manifest";source_manifest=$manifestFile;taxonomy_version=[int]$tax.taxonomy_version;model=$Model;generated_at=(UtcNow);review_threshold=$ReviewThreshold;complete=$false;summary=[pscustomobject][ordered]@{total=@($manifest.entries).Count;tagged=0;review_required=0;manual_locked=0;failed=0};entries=@()}}
function Save { $out.summary.tagged=@($out.entries|Where-Object{$_.vision_tagging.status -eq "tagged"}).Count;$out.summary.manual_locked=@($out.entries|Where-Object{$_.vision_tagging.status -eq "manual_locked"}).Count;$out.summary.failed=@($out.entries|Where-Object{$_.vision_tagging.status -eq "failed"}).Count;$out.summary.review_required=@($out.entries|Where-Object{$_.vision_tagging.review_required -eq $true}).Count;$out.complete=(($out.summary.tagged+$out.summary.manual_locked)-ge $out.summary.total -and $out.summary.failed -eq 0);$out.generated_at=UtcNow;Write-Json $out $outFile}
function Put($entry){$list=New-Object Collections.ArrayList;$found=$false;foreach($x in @($out.entries)){if($x.id -eq $entry.id){$null=$list.Add($entry);$found=$true}else{$null=$list.Add($x)}};if(-not $found){$null=$list.Add($entry)};$out.entries=@($list)}

$done=@{};foreach($x in @($out.entries)){if($x.vision_tagging.status -in @("tagged","manual_locked")){$done[$x.id]=$true}}
$key=$env:OPENAI_API_KEY;if(-not $DryRun -and -not $key){$sec=Read-Host "Enter OPENAI_API_KEY (hidden, not stored)" -AsSecureString;$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec);try{$key=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}}
$count=0
Write-Host "Pieceful Vision Tagging v0 | model=$Model | images=$(@($manifest.entries).Count)"
foreach($e in @($manifest.entries)){
  if($MaxItems -gt 0 -and $count -ge $MaxItems){break};if($done.ContainsKey($e.id)){continue};$count++
  if(ManualLocked $e){$c=Clone $e;$c|Add-Member -Force vision_tagging ([pscustomobject]@{status="manual_locked";review_required=$false;review_reasons=@();rationale="Manual authority preserved";generated_at=(UtcNow)});Put $c;Save;continue}
  $img=Join-Path $staging (($e.asset.local_game_candidate_path)-replace "/","\");if(-not(Test-Path $img)){throw "Missing image $img"}
  if($DryRun){Write-Host "READY $($e.id) $($e.title)";continue}
  Write-Host "TAG $($e.id) $($e.title)"
  try{$r=(OutputText (Api (Body $e (DataUrl $img)) $key))|ConvertFrom-Json;$errs=@(Validate-Result $r);if($errs.Count){throw ($errs -join "; ")};$c=Clone $e;$old=$c.taxonomy_draft;$c.taxonomy_draft=[pscustomobject][ordered]@{status="vision_suggested_v0";category=$r.taxonomy.category;subject=@($r.taxonomy.subject);region_culture=@($r.taxonomy.region_culture);mood=@($r.taxonomy.mood);visual=@($r.taxonomy.visual);style=@($r.taxonomy.style);scene=@($r.taxonomy.scene);facet_status=$r.taxonomy.facet_status;puzzleability=(P $old "puzzleability");suggested_difficulty=(P $old "suggested_difficulty")};$min=($ConfidenceFields|ForEach-Object{[double](P $r.confidence $_)}|Measure-Object -Minimum).Minimum;$reasons=New-Object Collections.ArrayList;foreach($z in @($r.review_reasons)){$null=$reasons.Add($z)};$review=($r.review_required -eq $true);if($min -lt $ReviewThreshold){$review=$true;$null=$reasons.Add("confidence_below_threshold")};foreach($f in $Facets){if((P $r.taxonomy.facet_status $f)-eq "unresolved"){$review=$true;$null=$reasons.Add("$($f)_unresolved")}};$c|Add-Member -Force vision_tagging ([pscustomobject][ordered]@{status="tagged";model=$Model;generated_at=(UtcNow);confidence=$r.confidence;min_confidence=[double]$min;review_required=$review;review_reasons=@($reasons|Select-Object -Unique);rationale=$r.rationale});Put $c;Save;Write-Host " -> $($c.taxonomy_draft.category) min_conf=$([math]::Round($min,2)) review=$review" -ForegroundColor Green
  }catch{$c=Clone $e;$c|Add-Member -Force vision_tagging ([pscustomobject]@{status="failed";review_required=$true;review_reasons=@("tagging_error");rationale=$_.Exception.Message;generated_at=(UtcNow)});Put $c;Save;Write-Warning "$($e.id): $($_.Exception.Message)";break}
  Start-Sleep -Milliseconds 250
}
if($DryRun){Write-Host "DRY RUN complete: $count item(s) ready";exit 0};Save;Write-Host "Output: $outFile";Write-Host "Tagged=$($out.summary.tagged) Review=$($out.summary.review_required) Failed=$($out.summary.failed)";if($out.complete){Write-Host "COMPLETE" -ForegroundColor Green;exit 0}else{Write-Warning "Incomplete; rerun to resume";exit 4}
