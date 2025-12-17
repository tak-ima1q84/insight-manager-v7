# Migration from v6 to v7

## What Changed

### Documentation Cleanup
- **Removed 20+ redundant documentation files** from v6
- **Kept only 4 essential docs**: README.md, QUICKSTART.md, CHANGELOG.md, MIGRATION_FROM_V6.md
- **Fixed QUICKSTART.md** with working step-by-step instructions

### Files Removed from v6
- LIGHTSAIL_DEPLOYMENT.md
- LIGHTSAIL_QUICKSTART.md
- DEPLOYMENT_*.md (multiple files)
- README_*.md (multiple variants)
- QUICK_*.md (multiple files)
- PROJECT_SUMMARY_*.md (multiple files)
- WHATS_NEW_*.md
- And 10+ other redundant docs

### What Stayed the Same
- ✅ All source code (`src/` directory)
- ✅ All frontend code (`public/` directory)
- ✅ Docker configuration
- ✅ Database schema and migrations
- ✅ Package dependencies
- ✅ Core functionality

## Migration Steps

If you're moving from v6 to v7:

1. **Backup your data** (if you have important insights):
   ```bash
   # In v6 directory
   docker-compose exec app bun run db:seed  # Export your data first
   ```

2. **Switch to v7**:
   ```bash
   cd ../insight-manager-v7
   docker-compose up -d
   sleep 10
   docker-compose exec app bun run db:push
   docker-compose exec app bun run db:seed
   ```

3. **Import your data** (if needed):
   - Use the CSV export/import feature
   - Or manually recreate your insights

## Benefits of v7

- 📚 **Clean documentation** - no more confusion about which guide to follow
- 🚀 **Working QUICKSTART** - tested step-by-step instructions
- 🧹 **Minimal files** - easier to navigate and maintain
- ✅ **Same functionality** - all features from v6 preserved

## Need Help?

1. Read [QUICKSTART.md](./QUICKSTART.md) for setup instructions
2. Check [README.md](./README.md) for feature overview
3. Run `./validate-setup.sh` to verify your installation