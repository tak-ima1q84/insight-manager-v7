#!/bin/bash

echo "🚀 GitHub Setup Script for Insight Manager v7"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the insight-manager-v7 directory"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not initialized"
    exit 1
fi

echo "📋 Current git status:"
git status --short

echo ""
echo "🔗 To push to GitHub, you need to:"
echo "1. Create a new repository on GitHub (e.g., 'insight-manager-v7')"
echo "2. Copy the repository URL (e.g., https://github.com/yourusername/insight-manager-v7.git)"
echo "3. Run the following commands:"
echo ""
echo "   git remote add origin YOUR_GITHUB_REPO_URL"
echo "   git push -u origin master"
echo "   git push -u origin aws"
echo ""
echo "📝 Example:"
echo "   git remote add origin https://github.com/yourusername/insight-manager-v7.git"
echo "   git push -u origin master"
echo "   git push -u origin aws"
echo ""
echo "🌟 Current branches:"
git branch -a
echo ""
echo "✅ Ready to push! The 'aws' branch is currently checked out."
echo "   This branch contains the clean v7 code ready for AWS deployment."