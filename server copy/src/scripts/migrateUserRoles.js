const mongoose = require('mongoose');
const User = require('../models/user.model');
const { ROLES, ROLE_HIERARCHY } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Migration script to update existing users to new role system
 * This script ensures backward compatibility while introducing new roles
 */
class RoleMigration {
    constructor() {
        this.migrationStats = {
            totalUsers: 0,
            migrated: 0,
            skipped: 0,
            errors: 0,
            roleMapping: {}
        };
    }

    /**
     * Map legacy roles to new role system
     */
    mapLegacyRole(currentRole) {
        const roleMapping = {
            // Direct mappings for new roles
            [ROLES.ADMIN]: ROLES.ADMIN,
            [ROLES.EDITOR]: ROLES.EDITOR,
            [ROLES.MEMBER]: ROLES.MEMBER,

            // Legacy role mappings
            [ROLES.REVIEWER]: ROLES.EDITOR,  // Reviewers become Editors
            [ROLES.AGENT]: ROLES.MEMBER,     // Agents become Members

            // Handle any undefined/null roles
            'undefined': ROLES.MEMBER,
            'null': ROLES.MEMBER,
            '': ROLES.MEMBER
        };

        return roleMapping[currentRole] || ROLES.MEMBER;
    }

    /**
     * Validate role transition
     */
    validateRoleTransition(oldRole, newRole) {
        const oldLevel = ROLE_HIERARCHY[oldRole] || 0;
        const newLevel = ROLE_HIERARCHY[newRole] || 0;

        return {
            valid: true,
            oldRole,
            newRole,
            oldLevel,
            newLevel,
            levelChange: newLevel - oldLevel
        };
    }

    /**
     * Migrate a single user
     */
    async migrateUser(user) {
        try {
            const currentRole = user.role || 'member';
            const newRole = this.mapLegacyRole(currentRole);

            // Track role mapping statistics
            if (!this.migrationStats.roleMapping[currentRole]) {
                this.migrationStats.roleMapping[currentRole] = {
                    count: 0,
                    newRole: newRole
                };
            }
            this.migrationStats.roleMapping[currentRole].count++;

            // Skip if role is already correct
            if (currentRole === newRole) {
                this.migrationStats.skipped++;
                logger.info(`User ${user.email} already has correct role: ${currentRole}`);
                return { skipped: true, user: user.email, role: currentRole };
            }

            // Validate transition
            const validation = this.validateRoleTransition(currentRole, newRole);

            if (!validation.valid) {
                this.migrationStats.errors++;
                logger.error(`Invalid role transition for ${user.email}: ${currentRole} -> ${newRole}`);
                return { error: true, user: user.email, reason: 'Invalid role transition' };
            }

            // Update user role
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                {
                    role: newRole,
                    $push: {
                        roleHistory: {
                            previousRole: currentRole,
                            newRole: newRole,
                            changedAt: new Date(),
                            changedBy: 'system_migration',
                            reason: 'Role system migration'
                        }
                    }
                },
                { new: true }
            );

            this.migrationStats.migrated++;
            logger.info(`Migrated user ${user.email}: ${currentRole} -> ${newRole}`);

            return {
                success: true,
                user: user.email,
                oldRole: currentRole,
                newRole: newRole,
                levelChange: validation.levelChange
            };

        } catch (error) {
            this.migrationStats.errors++;
            logger.error(`Error migrating user ${user.email}:`, error);
            return { error: true, user: user.email, reason: error.message };
        }
    }

    /**
     * Run the complete migration
     */
    async runMigration(options = {}) {
        const { dryRun = false, batchSize = 100 } = options;

        logger.info(`Starting role migration ${dryRun ? '(DRY RUN)' : ''}`);

        try {
            // Get all users
            const totalUsers = await User.countDocuments();
            this.migrationStats.totalUsers = totalUsers;

            logger.info(`Found ${totalUsers} users to process`);

            if (totalUsers === 0) {
                logger.info('No users found to migrate');
                return this.migrationStats;
            }

            // Process users in batches
            let processed = 0;
            const results = [];

            while (processed < totalUsers) {
                const users = await User.find({})
                    .skip(processed)
                    .limit(batchSize)
                    .lean();

                logger.info(`Processing batch: ${processed + 1} - ${processed + users.length}`);

                for (const user of users) {
                    if (dryRun) {
                        // Dry run - just analyze what would happen
                        const currentRole = user.role || 'member';
                        const newRole = this.mapLegacyRole(currentRole);

                        if (!this.migrationStats.roleMapping[currentRole]) {
                            this.migrationStats.roleMapping[currentRole] = {
                                count: 0,
                                newRole: newRole
                            };
                        }
                        this.migrationStats.roleMapping[currentRole].count++;

                        if (currentRole === newRole) {
                            this.migrationStats.skipped++;
                        } else {
                            this.migrationStats.migrated++;
                        }

                        results.push({
                            user: user.email,
                            currentRole,
                            newRole,
                            action: currentRole === newRole ? 'skip' : 'migrate'
                        });
                    } else {
                        // Actual migration
                        const result = await this.migrateUser(user);
                        results.push(result);
                    }
                }

                processed += users.length;
            }

            logger.info('Migration completed successfully');
            logger.info('Migration Statistics:', this.migrationStats);

            return {
                success: true,
                stats: this.migrationStats,
                results: results.slice(0, 50), // Return first 50 results for review
                dryRun
            };

        } catch (error) {
            logger.error('Migration failed:', error);
            throw error;
        }
    }

    /**
     * Rollback migration (restore previous roles)
     */
    async rollbackMigration() {
        logger.info('Starting role migration rollback');

        try {
            const usersWithHistory = await User.find({
                'roleHistory.changedBy': 'system_migration'
            });

            let rolledBack = 0;
            let errors = 0;

            for (const user of usersWithHistory) {
                try {
                    // Find the most recent migration entry
                    const migrationEntry = user.roleHistory
                        .filter(entry => entry.changedBy === 'system_migration')
                        .sort((a, b) => b.changedAt - a.changedAt)[0];

                    if (migrationEntry) {
                        await User.findByIdAndUpdate(user._id, {
                            role: migrationEntry.previousRole,
                            $push: {
                                roleHistory: {
                                    previousRole: user.role,
                                    newRole: migrationEntry.previousRole,
                                    changedAt: new Date(),
                                    changedBy: 'system_rollback',
                                    reason: 'Migration rollback'
                                }
                            }
                        });

                        rolledBack++;
                        logger.info(`Rolled back user ${user.email}: ${user.role} -> ${migrationEntry.previousRole}`);
                    }
                } catch (error) {
                    errors++;
                    logger.error(`Error rolling back user ${user.email}:`, error);
                }
            }

            logger.info(`Rollback completed: ${rolledBack} users rolled back, ${errors} errors`);
            return { success: true, rolledBack, errors };

        } catch (error) {
            logger.error('Rollback failed:', error);
            throw error;
        }
    }

    /**
     * Generate migration report
     */
    generateReport() {
        const report = {
            summary: {
                totalUsers: this.migrationStats.totalUsers,
                migrated: this.migrationStats.migrated,
                skipped: this.migrationStats.skipped,
                errors: this.migrationStats.errors,
                successRate: this.migrationStats.totalUsers > 0
                    ? ((this.migrationStats.migrated + this.migrationStats.skipped) / this.migrationStats.totalUsers * 100).toFixed(2) + '%'
                    : '0%'
            },
            roleMapping: this.migrationStats.roleMapping,
            recommendations: []
        };

        // Add recommendations based on migration results
        if (this.migrationStats.errors > 0) {
            report.recommendations.push('Review error logs and retry failed migrations');
        }

        if (this.migrationStats.roleMapping[ROLES.REVIEWER]?.count > 0) {
            report.recommendations.push('Former reviewers are now editors - verify their permissions are appropriate');
        }

        if (this.migrationStats.roleMapping[ROLES.AGENT]?.count > 0) {
            report.recommendations.push('Former agents are now members - consider upgrading some to editor role if needed');
        }

        return report;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const rollback = args.includes('--rollback');

    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inboxflow')
        .then(async () => {
            const migration = new RoleMigration();

            if (rollback) {
                const result = await migration.rollbackMigration();
                logger.info('Rollback Result:', JSON.stringify(result, null, 2));
            } else {
                const result = await migration.runMigration({ dryRun });
                logger.info('Migration Result:', JSON.stringify(result, null, 2));

                if (dryRun) {
                    logger.info('\nMigration Report:');
                    logger.info(JSON.stringify(migration.generateReport(), null, 2));
                }
            }

            process.exit(0);
        })
        .catch(error => {
            logger.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = RoleMigration;