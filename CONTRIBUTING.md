# Contributing to Claude Task Manager

First off, thank you for considering contributing to Claude Task Manager! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**How to Submit a Good Bug Report:**
- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples
- Describe the behavior you observed and what you expected
- Include screenshots if relevant
- Note your OS, Node.js version, and any other relevant details

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

**How to Submit a Good Enhancement Suggestion:**
- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain the expected behavior
- Explain why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Issue that pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/claude-task-manager
cd claude-task-manager

# Install dependencies
npm install

# Run tests
npm test

# Start development
npm run dev
```

## Code Style Guidelines

### JavaScript
- Use ES6+ features where appropriate
- Use async/await over callbacks
- Add JSDoc comments for functions
- Keep functions small and focused

### Commits
- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Keep commits atomic (one feature/fix per commit)

Example:
```
Fix: XSS vulnerability in task viewer
Add: Windows support for CLI tool
Update: Search performance with JSON index
```

### File Organization
```
claude-task-manager/
├── cli.js           # Main CLI entry point
├── defaults/        # Default configurations
├── hooks/          # Hook configurations
├── scripts/        # Utility scripts
└── tests/          # Test files
```

## Good First Issues

Look for issues labeled with `good first issue` - these are great for newcomers!

## Community

- Join discussions in Issues
- Share your use cases
- Help others with their questions

## Recognition

Contributors will be added to the README's Contributors section. We appreciate every contribution, no matter how small!

## Questions?

Feel free to open an issue with the label `question` if you need help.

Thank you for making Claude Task Manager better! 🚀