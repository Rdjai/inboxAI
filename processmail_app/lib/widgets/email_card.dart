import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:processmail_app/models/email_model.dart';
import 'package:processmail_app/providers/theme_provider.dart';
import 'package:processmail_app/screens/email_detail_screen.dart';

class EmailCard extends StatelessWidget {
  final Email email;

  const EmailCard({super.key, required this.email});

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color:
              isDark ? AppThemeColors.borderDark : AppThemeColors.borderLight,
          width: 1,
        ),
      ),
      color: isDark ? AppThemeColors.surfaceDark : AppThemeColors.surfaceLight,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => EmailDetailScreen(email: email),
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  gradient: _getAvatarGradient(email.senderAvatar),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 6,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    email.senderAvatar,
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 12),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            email.sender,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: email.isRead
                                  ? FontWeight.normal
                                  : FontWeight.w600,
                              color: email.isRead
                                  ? isDark
                                      ? AppThemeColors.textSecondaryDark
                                      : AppThemeColors.textSecondaryLight
                                  : isDark
                                      ? AppThemeColors.textPrimaryDark
                                      : AppThemeColors.textPrimaryLight,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            gradient: _getTimeGradient(email.date),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            _formatTime(email.date),
                            style: GoogleFonts.poppins(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      email.subject,
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: isDark
                            ? AppThemeColors.textPrimaryDark
                            : AppThemeColors.textPrimaryLight,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      email.preview,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: isDark
                            ? AppThemeColors.textSecondaryDark
                            : AppThemeColors.textSecondaryLight,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (email.isStarred)
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppThemeColors.accentAmber
                                  .withValues(alpha: isDark ? 0.2 : 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.star,
                              size: 14,
                              color: AppThemeColors.accentAmber,
                            ),
                          ),
                        if (email.isStarred) const SizedBox(width: 6),
                        if (email.isImportant)
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppThemeColors.error
                                  .withValues(alpha: isDark ? 0.2 : 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.label_important,
                              size: 14,
                              color: AppThemeColors.error,
                            ),
                          ),
                        if (email.isImportant) const SizedBox(width: 6),
                        if (email.hasAttachments)
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppThemeColors.primaryBlue
                                  .withValues(alpha: isDark ? 0.2 : 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.attach_file,
                              size: 14,
                              color: AppThemeColors.primaryBlue,
                            ),
                          ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getCategoryColor(email.category)
                                .withValues(alpha: isDark ? 0.2 : 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _getCategoryName(email.category),
                            style: GoogleFonts.poppins(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: _getCategoryColor(email.category),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Gradient _getAvatarGradient(String initials) {
    final index = initials.codeUnits.fold(0, (a, b) => a + b) % 4;
    switch (index) {
      case 0:
        return HomepageTheme.blueCyanGradient;
      case 1:
        return HomepageTheme.purplePinkGradient;
      case 2:
        return HomepageTheme.greenEmeraldGradient;
      case 3:
        return HomepageTheme.orangeRedGradient;
      default:
        return HomepageTheme.primaryGradient;
    }
  }

  Gradient _getTimeGradient(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inHours < 1) {
      return HomepageTheme.greenGradient;
    } else if (difference.inHours < 24) {
      return HomepageTheme.blueCyanGradient;
    } else {
      return HomepageTheme.purplePinkGradient;
    }
  }

  Color _getCategoryColor(EmailCategory category) {
    switch (category) {
      case EmailCategory.inbox:
        return AppThemeColors.primaryBlue;
      case EmailCategory.starred:
        return AppThemeColors.accentAmber;
      case EmailCategory.important:
        return AppThemeColors.error;
      case EmailCategory.sent:
        return AppThemeColors.success;
      case EmailCategory.draft:
        return AppThemeColors.textSecondaryLight;
      case EmailCategory.spam:
        return AppThemeColors.accentOrange;
      case EmailCategory.trash:
        return AppThemeColors.error;
      case EmailCategory.promotions:
        return AppThemeColors.accentPink;
      case EmailCategory.social:
        return AppThemeColors.primaryBlue;
      case EmailCategory.forums:
        return AppThemeColors.accentCyan;
    }
  }

  String _getCategoryName(EmailCategory category) {
    switch (category) {
      case EmailCategory.inbox:
        return 'Inbox';
      case EmailCategory.starred:
        return 'Starred';
      case EmailCategory.important:
        return 'Important';
      case EmailCategory.sent:
        return 'Sent';
      case EmailCategory.draft:
        return 'Draft';
      case EmailCategory.spam:
        return 'Spam';
      case EmailCategory.trash:
        return 'Trash';
      case EmailCategory.promotions:
        return 'Promotions';
      case EmailCategory.social:
        return 'Social';
      case EmailCategory.forums:
        return 'Forums';
    }
  }

  String _formatTime(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 365) {
      return '${difference.inDays ~/ 365}y';
    } else if (difference.inDays > 30) {
      return '${difference.inDays ~/ 30}mo';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'Now';
    }
  }
}
