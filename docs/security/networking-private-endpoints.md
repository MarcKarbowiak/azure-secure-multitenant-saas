# Networking Model with Private Endpoints

The deployment isolates PaaS resources from public access.

## Network Topology

- One VNet with:
  - Function integration subnet.
  - Private endpoint subnet.
- Private endpoints created for:
  - Cosmos DB (`Sql` group).
  - Storage Account (`blob` group).
  - Key Vault (`vault` group).

## Name Resolution

Private DNS zones are provisioned and linked to the VNet:

- `privatelink.documents.azure.com`
- `privatelink.blob.core.windows.net`
- `privatelink.vaultcore.azure.net`

## Security Outcome

Data-plane access flows through private IP resolution inside the VNet, reducing exposure and supporting defense-in-depth policies.

