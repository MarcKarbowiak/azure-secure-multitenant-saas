# Identity and Zero-Secrets Model

This architecture uses Managed Identity and RBAC instead of static credentials.

## Runtime Identity

- A user-assigned managed identity is attached to the Function App.
- The API uses `ManagedIdentityCredential` to authenticate to Cosmos DB.
- Storage and Key Vault permissions are granted by RBAC role assignments.

## No Connection Strings

- Cosmos access uses endpoint + AAD credential.
- Storage uses identity-based Function settings (`AzureWebJobsStorage__accountName`, `__credential`, `__clientId`).
- Key Vault access is RBAC-only with private endpoint.

## JWT Application Identity

- Incoming JWT claims provide tenant/user identity and app role for authorization.
- Signature validation is expected upstream (for example APIM/EasyAuth); API enforces claims and roles.

