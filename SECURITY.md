## Security Best Practices

When deploying this application:

1. **Environment Variables**: Never commit `.env` files or expose sensitive credentials
2. **WordPress Security**: Ensure your WordPress backend is secured with:
   - Strong authentication
   - HTTPS enabled
   - Regular updates
   - Proper GraphQL endpoint access controls
3. **Netlify reCAPTCHA**: Keep your reCAPTCHA secret key secure
4. **Dependencies**: Regularly update dependencies to patch known vulnerabilities
5. **Access Control**: Restrict WordPress GraphQL API access to authorized domains only

## Known Security Considerations

- This application uses WordPress as a headless CMS - ensure your WordPress instance follows security best practices
- GraphQL endpoints should be protected with proper authentication
- API keys and passwords should be stored in environment variables, never in code
- The contact form uses Netlify's reCAPTCHA - ensure it's properly configured

## Dependency Scanning

Regularly scan dependencies for vulnerabilities. Run the following to check for issues:

```bash
npm audit
```

To fix automatically fixable vulnerabilities:

```bash
npm audit fix
```
