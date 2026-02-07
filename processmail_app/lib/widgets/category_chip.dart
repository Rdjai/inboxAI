import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:processmail_app/providers/email_provider.dart';
import 'package:processmail_app/providers/theme_provider.dart';
import 'package:processmail_app/models/email_model.dart';

class CategoryChip extends StatelessWidget {
  final EmailCategory category;

  const CategoryChip({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    final emailProvider = Provider.of<EmailProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.themeMode == ThemeMode.dark;
    final isSelected = emailProvider.currentCategory == category;
    final count = _getCount(emailProvider);

    return Container(
      margin: const EdgeInsets.only(right: 8),
      child: Material(
        borderRadius: BorderRadius.circular(20),
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            emailProvider.setCategory(category);
          },
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              gradient: isSelected ? _getGradient(category) : null,
              color: isSelected
                  ? null
                  : isDark
                      ? AppThemeColors.surfaceDark
                      : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected
                    ? Colors.transparent
                    : isDark
                        ? AppThemeColors.borderDark
                        : AppThemeColors.borderLight,
                width: 1.5,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: _getColor(category).withOpacity(0.3),
                        blurRadius: 8,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _getIcon(category),
                  size: 18,
                  color: isSelected ? Colors.white : _getColor(category),
                ),
                const SizedBox(width: 8),
                Text(
                  _getName(category),
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: isSelected ? Colors.white : _getColor(category),
                  ),
                ),
                if (count > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Colors.white.withOpacity(0.2)
                          : _getColor(category).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      count.toString(),
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : _getColor(category),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  int _getCount(EmailProvider provider) {
    switch (category) {
      case EmailCategory.inbox:
        return provider.emails
            .where((e) => e.category == EmailCategory.inbox && !e.isRead)
            .length;
      case EmailCategory.starred:
        return provider.starredCount;
      case EmailCategory.important:
        return provider.importantCount;
      default:
        return provider.emails.where((e) => e.category == category).length;
    }
  }

  Color _getColor(EmailCategory category) {
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

  Gradient? _getGradient(EmailCategory category) {
    switch (category) {
      case EmailCategory.inbox:
        return HomepageTheme.primaryGradient;
      case EmailCategory.starred:
        return HomepageTheme.amberGradient;
      case EmailCategory.important:
        return const LinearGradient(
          colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        );
      case EmailCategory.sent:
        return HomepageTheme.greenGradient;
      case EmailCategory.promotions:
        return HomepageTheme.purplePinkGradient;
      default:
        return HomepageTheme.blueCyanGradient;
    }
  }

  IconData _getIcon(EmailCategory category) {
    switch (category) {
      case EmailCategory.inbox:
        return Icons.inbox;
      case EmailCategory.starred:
        return Icons.star;
      case EmailCategory.important:
        return Icons.label_important;
      case EmailCategory.sent:
        return Icons.send;
      case EmailCategory.draft:
        return Icons.drafts;
      case EmailCategory.spam:
        return Icons.report;
      case EmailCategory.trash:
        return Icons.delete;
      case EmailCategory.promotions:
        return Icons.local_offer;
      case EmailCategory.social:
        return Icons.people;
      case EmailCategory.forums:
        return Icons.forum;
    }
  }

  String _getName(EmailCategory category) {
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
}
