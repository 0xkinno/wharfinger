export const missingEnv = (keys: string[]) => keys.filter((k) => !process.env[k]);
export const notConfigured = (missing: string[]) => Response.json({ error: "this feature needs server configuration that is not set yet", missing, how: "see DEPLOY.md in the repository" }, { status: 503 });
