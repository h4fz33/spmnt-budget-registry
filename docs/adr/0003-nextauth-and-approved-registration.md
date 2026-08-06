# NextAuth and Approved Registration

**Status:** accepted

SchoolBanchee uses NextAuth for credential authentication and route middleware, while server-side authorization remains authoritative for every command and data query. A public registration creates a Registration Application only: it grants no membership, role, or financial access until a System Admin or authorized ESAO Admin approves an organization-scoped role. System Admin and ESAO Admin roles cannot be requested publicly, approval and later suspension/role changes are audited, inactive membership is checked on protected server access, and the first System Admin is provisioned through a one-time operational bootstrap rather than public registration.

