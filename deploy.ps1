param(
  [Parameter(Mandatory = $true)]
  [string]$SubscriptionId,

  [Parameter(Mandatory = $true)]
  [string]$ResourceGroupName,

  [Parameter(Mandatory = $false)]
  [string]$Location = "eastus",

  [Parameter(Mandatory = $false)]
  [string]$ParameterFile = "infra/bicep/parameters.dev.json",

  [Parameter(Mandatory = $false)]
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "Setting Azure subscription context..."
az account set --subscription $SubscriptionId | Out-Null

if ($DryRun) {
  Write-Host "Dry run enabled. Checking that resource group '$ResourceGroupName' exists..."
  $rgExists = az group exists --name $ResourceGroupName
  if ($rgExists -ne "true") {
    throw "Resource group '$ResourceGroupName' does not exist. Create it first, then run dry run again."
  }

  Write-Host "Running what-if preview..."
  az deployment group what-if `
    --resource-group $ResourceGroupName `
    --template-file "infra/bicep/main.bicep" `
    --parameters "@$ParameterFile"

  Write-Host "Dry run complete. No resources were created or updated."
  exit 0
}

Write-Host "Ensuring resource group '$ResourceGroupName' exists in '$Location'..."
az group create --name $ResourceGroupName --location $Location | Out-Null

Write-Host "Deploying infrastructure..."
az deployment group create `
  --resource-group $ResourceGroupName `
  --template-file "infra/bicep/main.bicep" `
  --parameters "@$ParameterFile"

Write-Host "Deployment complete."
