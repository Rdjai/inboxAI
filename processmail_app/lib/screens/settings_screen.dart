import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:processmail_app/providers/theme_provider.dart';
import 'package:processmail_app/providers/email_provider.dart';
import 'package:processmail_app/providers/auth_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final emailProvider = Provider.of<EmailProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final isDark = themeProvider.themeMode == ThemeMode.dark;
    final displayName = authProvider.currentUserName ?? 'Guest User';
    final displayEmail = authProvider.currentUserEmail ?? 'Not connected';

    return Scaffold(
      backgroundColor: isDark
          ? AppThemeColors.backgroundDark
          : AppThemeColors.backgroundLight,
      appBar: AppBar(
        backgroundColor:
            isDark ? AppThemeColors.surfaceDark : AppThemeColors.surfaceLight,
        foregroundColor: isDark
            ? AppThemeColors.textPrimaryDark
            : AppThemeColors.textPrimaryLight,
        elevation: 2,
        title: Text(
          'Settings',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Section
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppThemeColors.surfaceDark : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? AppThemeColors.borderDark
                    : AppThemeColors.borderLight,
              ),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: HomepageTheme.primaryGradient,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.person,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  displayName,
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? AppThemeColors.textPrimaryDark
                        : AppThemeColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  displayEmail,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: isDark
                        ? AppThemeColors.textSecondaryDark
                        : AppThemeColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // App Settings
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppThemeColors.surfaceDark : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? AppThemeColors.borderDark
                    : AppThemeColors.borderLight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text(
                    'App Settings',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: isDark
                          ? AppThemeColors.textPrimaryDark
                          : AppThemeColors.textPrimaryLight,
                    ),
                  ),
                ),
                const Divider(height: 0),
                SwitchListTile(
                  title: Text(
                    'Dark Mode',
                    style: GoogleFonts.poppins(
                      color: isDark
                          ? AppThemeColors.textPrimaryDark
                          : AppThemeColors.textPrimaryLight,
                    ),
                  ),
                  subtitle: Text(
                    'Toggle dark theme',
                    style: GoogleFonts.poppins(
                      color: isDark
                          ? AppThemeColors.textSecondaryDark
                          : AppThemeColors.textSecondaryLight,
                    ),
                  ),
                  value: themeProvider.themeMode == ThemeMode.dark,
                  onChanged: (value) {
                    themeProvider.toggleTheme();
                  },
                ),
                SwitchListTile(
                  title: Text(
                    'Notifications',
                    style: GoogleFonts.poppins(
                      color: isDark
                          ? AppThemeColors.textPrimaryDark
                          : AppThemeColors.textPrimaryLight,
                    ),
                  ),
                  subtitle: Text(
                    'Enable push notifications',
                    style: GoogleFonts.poppins(
                      color: isDark
                          ? AppThemeColors.textSecondaryDark
                          : AppThemeColors.textSecondaryLight,
                    ),
                  ),
                  value: true,
                  onChanged: (value) {},
                ),
                SwitchListTile(
                  title: Text(
                    'Auto Sync',
                    style: GoogleFonts.poppins(
                      color: isDark
                          ? AppThemeColors.textPrimaryDark
                          : AppThemeColors.textPrimaryLight,
                    ),
                  ),
                  subtitle: Text(
                    'Automatically sync emails',
                    style: GoogleFonts.poppins(
                      color: isDark
                          ? AppThemeColors.textSecondaryDark
                          : AppThemeColors.textSecondaryLight,
                    ),
                  ),
                  value: true,
                  onChanged: (value) {},
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // About
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppThemeColors.surfaceDark : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? AppThemeColors.borderDark
                    : AppThemeColors.borderLight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text(
                    'About',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: isDark
                          ? AppThemeColors.textPrimaryDark
                          : AppThemeColors.textPrimaryLight,
                    ),
                  ),
                ),
                const Divider(height: 0),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: Text(
                    'Version',
                    style: GoogleFonts.poppins(
                      color: isDark
                          ? AppThemeColors.textPrimaryDark
                          : AppThemeColors.textPrimaryLight,
                    ),
                  ),
                  subtitle: Text(
                    '1.0.0',
                    style: GoogleFonts.poppins(
                      color: isDark
                          ? AppThemeColors.textSecondaryDark
                          : AppThemeColors.textSecondaryLight,
                    ),
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.star_outline),
                  title: Text(
                    'Rate App',
                    style: GoogleFonts.poppins(
                      color: isDark
                          ? AppThemeColors.textPrimaryDark
                          : AppThemeColors.textPrimaryLight,
                    ),
                  ),
                  onTap: () {},
                ),
                ListTile(
                  leading: const Icon(Icons.support_agent_outlined),
                  title: Text(
                    'Contact Support',
                    style: GoogleFonts.poppins(
                      color: isDark
                          ? AppThemeColors.textPrimaryDark
                          : AppThemeColors.textPrimaryLight,
                    ),
                  ),
                  onTap: () {},
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Logout Button
          if (authProvider.isLoggedIn || emailProvider.accounts.isNotEmpty)
            ElevatedButton(
              onPressed: () {
                context.read<AuthProvider>().logout();
                emailProvider.logout();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('Logged out successfully'),
                    backgroundColor: AppThemeColors.success,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppThemeColors.error,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Logout'),
            ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
