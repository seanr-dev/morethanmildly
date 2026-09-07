# More Than Mildly admin host

This directory deploys to the existing Netlify project `morethanmildly-admin` (`d9a31e90-d937-4622-b34f-006be7aabaa3`). It is a static proxy for the publication's protected editorial workspace.

The project is connected to `seanr-dev/morethanmildly` on `main`, using `admin-host` as the base directory, no build command, and `public` as the publish directory. Netlify selects this directory's `netlify.toml`. Keep the package-directory setting blank; the base directory already contains the configuration.

Changes under this directory should trigger an automatic deployment of the admin host. Publication code changes deploy on the primary project; the proxy serves its updated admin pages and assets.

The primary project owns the database and uploaded media. Every editorial API request requires authentication and the administrator role. The separate host's Identity proxy currently produces a reserved-path warning and needs resolution before authenticated login can be verified. Do not treat the signed-out login page as proof that authenticated operations work.

See [deployment instructions](../DEPLOYMENT.md) and [verification records](../VERIFICATION.md) for current setup requirements and release evidence.
