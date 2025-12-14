This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:


You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Code Quality: TypeScript, ESLint, Prettier, Husky

- **TypeScript (strict)**: `tsconfig.json` enables strict checks (`strict`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `forceConsistentCasingInFileNames`, `skipLibCheck`) to catch type errors early and reduce runtime bugs.
- **ESLint**: Configuration in `.eslintrc.json` extends `next/core-web-vitals` and `plugin:prettier/recommended`. Key rules: `no-console` (warn), `semi` (always), `quotes` (double).
- **Prettier**: Settings in `.prettierrc` ensure consistent formatting (`singleQuote: false`, `semi: true`, `tabWidth: 2`, `trailingComma: es5`).
- **Pre-commit hooks**: Husky and `lint-staged` run `eslint --fix` and `prettier --write` on staged `.{ts,tsx,js,jsx}` files to enforce style and fixable lint issues before commits.

Run these locally to apply and verify:

```bash
cd trust-x
npm install
npm run prepare    # runs `husky install` (prepare script added in package.json)
# make hooks executable (if needed):
git update-index --add --chmod=+x .husky/pre-commit
# try a commit to confirm hooks run
git add .
git commit -m "test husky lint" || true
```

If the pre-commit hook blocks commits, fix reported lint/format issues and re-stage the files; `lint-staged` will re-run the fixes automatically.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Environment Variables

This project uses environment variables to manage secrets securely.

### Files
- `.env.local`: real credentials (ignored by Git)
- `.env.example`: template for setup

### Server-side variables
- DATABASE_URL – database connection
- JWT_SECRET – authentication secret

### Client-side variables
- NEXT_PUBLIC_API_BASE_URL – API base URL

### Setup
1. Copy `.env.example` to `.env.local`
2. Fill real values
3. Restart server

### Security
- Secrets never exposed to client
- `.env.local` is gitignored
