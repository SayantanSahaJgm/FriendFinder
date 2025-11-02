# Contributing to FriendFinder

Thank you for your interest in contributing to FriendFinder! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Maintain professionalism in all interactions

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

1. **Clear title**: Describe the issue briefly
2. **Description**: Explain what happened vs. what you expected
3. **Steps to reproduce**: Detailed steps to reproduce the issue
4. **Environment**: OS, Node version, browser, etc.
5. **Screenshots**: If applicable
6. **Error logs**: Include relevant console output

### Suggesting Features

Feature requests are welcome! Please include:

1. **Use case**: Explain the problem this feature solves
2. **Proposed solution**: Describe how you envision it working
3. **Alternatives**: Any alternative solutions you've considered
4. **Additional context**: Screenshots, mockups, or examples

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the coding standards below
4. **Test your changes**: Ensure everything works
5. **Commit with clear messages**: `git commit -m 'Add amazing feature'`
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes clearly

## Development Setup

See [SETUP.md](SETUP.md) for detailed setup instructions.

## Coding Standards

### Backend (Node.js/Express)

- Use `const` for immutable values, `let` for mutable
- Follow async/await patterns for asynchronous code
- Add error handling to all async functions
- Use meaningful variable and function names
- Add comments for complex logic
- Validate input data
- Use proper HTTP status codes

Example:
```javascript
// Good
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
```

### Frontend (React)

- Use functional components with hooks
- Keep components small and focused
- Use descriptive prop names
- Handle loading and error states
- Follow React best practices
- Use Tailwind CSS for styling

Example:
```javascript
// Good
const UserCard = ({ user, onSelect }) => {
  if (!user) return null;
  
  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      <h3 className="font-semibold">{user.name}</h3>
      <button onClick={() => onSelect(user)}>
        Select
      </button>
    </div>
  );
};
```

### General Guidelines

- Write self-documenting code
- Add comments for complex algorithms
- Keep functions small and focused
- Avoid deep nesting
- Handle edge cases
- Write meaningful commit messages

## Project Structure

```
FriendFinder-Vscode/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── utils/         # Utility functions
│   │   └── server.js      # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── services/      # API services
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Testing Guidelines

Currently, the project doesn't have automated tests. If you're adding tests:

- Write unit tests for utilities and helpers
- Write integration tests for API endpoints
- Write component tests for React components
- Ensure tests are isolated and repeatable
- Mock external dependencies

## Security Guidelines

- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Validate and sanitize all user input
- Use parameterized queries (Mongoose does this)
- Implement rate limiting (already included)
- Keep dependencies updated
- Follow OWASP security best practices

## Database Changes

If modifying database models:

1. Consider backward compatibility
2. Document schema changes
3. Provide migration instructions if needed
4. Update relevant API documentation
5. Test with sample data

## API Changes

When adding or modifying API endpoints:

1. Follow RESTful conventions
2. Use appropriate HTTP methods and status codes
3. Implement proper error handling
4. Add input validation
5. Update API documentation in README
6. Consider rate limiting needs

## UI/UX Changes

For frontend changes:

1. Maintain consistent design language
2. Ensure responsive design (mobile-friendly)
3. Test on multiple browsers
4. Consider accessibility (WCAG guidelines)
5. Add loading and error states
6. Provide user feedback for actions

## Commit Message Guidelines

Use clear, descriptive commit messages:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

Examples:
```
feat: Add video call recording feature
fix: Correct message alignment in chat
docs: Update setup instructions
refactor: Simplify authentication logic
```

## Pull Request Guidelines

Before submitting a PR:

- [ ] Code follows the project's coding standards
- [ ] Changes are tested and working
- [ ] No console errors or warnings
- [ ] Documentation is updated if needed
- [ ] Commits have clear messages
- [ ] PR description explains the changes

## Questions?

If you have questions:

1. Check existing documentation
2. Search existing issues
3. Ask in the issue tracker
4. Tag maintainers if urgent

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Recognition

Contributors will be recognized in the project's README. Thank you for helping make FriendFinder better!
