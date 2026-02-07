import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:processmail_app/models/email_model.dart';
import 'package:processmail_app/providers/theme_provider.dart';

class AccountCard extends StatelessWidget {
  final MailAccount account;

  const AccountCard({super.key, required this.account});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppThemeColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color:
              isDark ? AppThemeColors.borderDark : AppThemeColors.borderLight,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: _getAvatarGradient(account.avatar),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      account.avatar,
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        account.name,
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppThemeColors.textPrimaryDark
                              : AppThemeColors.textPrimaryLight,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        account.provider,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: isDark
                              ? AppThemeColors.textSecondaryDark
                              : AppThemeColors.textSecondaryLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              account.email,
              style: GoogleFonts.poppins(
                fontSize: 11,
                color: isDark
                    ? AppThemeColors.textSecondaryDark
                    : AppThemeColors.textSecondaryLight,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    gradient: account.unreadCount > 0
                        ? HomepageTheme.blueCyanGradient
                        : null,
                    color: account.unreadCount > 0
                        ? null
                        : (isDark
                            ? AppThemeColors.surfaceDark
                            : Colors.grey[100]),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.mail_outline,
                        size: 12,
                        color: account.unreadCount > 0
                            ? Colors.white
                            : (isDark
                                ? AppThemeColors.textSecondaryDark
                                : AppThemeColors.textSecondaryLight),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${account.unreadCount} unread',
                        style: GoogleFonts.poppins(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: account.unreadCount > 0
                              ? Colors.white
                              : (isDark
                                  ? AppThemeColors.textSecondaryDark
                                  : AppThemeColors.textSecondaryLight),
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: isDark ? AppThemeColors.surfaceDark : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isDark
                          ? AppThemeColors.borderDark
                          : AppThemeColors.borderLight,
                    ),
                  ),
                  child: Icon(
                    Icons.open_in_new,
                    size: 14,
                    color: isDark
                        ? AppThemeColors.textSecondaryDark
                        : AppThemeColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ],
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
}
