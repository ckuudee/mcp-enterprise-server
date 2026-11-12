# MCP Enterprise Server

A Model Context Protocol (MCP) server that lets an LLM query a private SQL database through a small set of validated, read-only tools.

> Status: early scaffold. Nothing is implemented yet.

## Goals

- Expose database access to AI clients (e.g. Claude Desktop) over the MCP HTTP/SSE transport.
- Validate every tool input with Zod schemas.
- Run only parameterized, allow-listed SQL. The model never writes raw SQL.
- Be tested and demo-able end to end.

## Stack

TypeScript, Node.js, `@modelcontextprotocol/sdk`, Express, Zod, SQL (database TBD).

## Roadmap

- [ ] MCP server skeleton with HTTP/SSE transport
- [ ] Mock database schema and seed data
- [ ] Tool definitions with Zod validation and parameterized queries
- [ ] Authentication and rate limiting
- [ ] Unit and integration tests
- [ ] CI (GitHub Actions)
- [ ] Claude Desktop integration demo

## License

TBD
