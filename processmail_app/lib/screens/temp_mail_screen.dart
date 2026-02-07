import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:processmail_app/providers/email_provider.dart';
import 'package:processmail_app/providers/theme_provider.dart';
import 'package:processmail_app/models/email_model.dart';

class TempMailScreen extends StatefulWidget {
  const TempMailScreen({super.key});

  @override
  State<TempMailScreen> createState() => _TempMailScreenState();
}

class _TempMailScreenState extends State<TempMailScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollOffset = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      setState(() {
        _scrollOffset = _scrollController.offset;
      });
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final emailProvider = Provider.of<EmailProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppThemeColors.backgroundDark
          : AppThemeColors.backgroundLight,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // App Bar
          SliverAppBar(
            floating: true,
            pinned: true,
            expandedHeight: 210.0,
            backgroundColor: _scrollOffset > 50
                ? (isDark
                    ? AppThemeColors.surfaceDark
                    : AppThemeColors.surfaceLight)
                : Colors.transparent,
            elevation: _scrollOffset > 50 ? 4 : 0,
            shape: _scrollOffset > 50
                ? const ContinuousRectangleBorder(
                    borderRadius: BorderRadius.vertical(
                      bottom: Radius.circular(30),
                    ),
                  )
                : null,
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: Container(
                decoration: BoxDecoration(
                  gradient: HomepageTheme.purplePinkGradient,
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 60, 24, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        'Temporary Mail',
                        style: GoogleFonts.poppins(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Create disposable email addresses',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            title: _scrollOffset > 50
                ? Text(
                    'Temp Mail',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                      color: isDark
                          ? AppThemeColors.textPrimaryDark
                          : AppThemeColors.textPrimaryLight,
                    ),
                  )
                : null,
            leading: IconButton(
              icon: Icon(
                Icons.arrow_back,
                color: _scrollOffset > 50
                    ? (isDark
                        ? AppThemeColors.textPrimaryDark
                        : AppThemeColors.textPrimaryLight)
                    : Colors.white,
              ),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: Icon(
                  Icons.info_outline,
                  color: _scrollOffset > 50
                      ? (isDark
                          ? AppThemeColors.textPrimaryDark
                          : AppThemeColors.textPrimaryLight)
                      : Colors.white,
                ),
                onPressed: () {
                  _showInfoDialog(context);
                },
              ),
            ],
          ),

          // Main Content
          SliverList(
            delegate: SliverChildListDelegate([
              // Create New Temp Mail Card
              Padding(
                padding: const EdgeInsets.all(20),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: HomepageTheme.greenEmeraldGradient,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: AppThemeColors.accentGreen.withOpacity(0.3),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.vpn_key_outlined,
                            size: 32,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'Generate Temporary Email',
                          style: GoogleFonts.poppins(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Create a disposable email address that expires in 24 hours',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () {
                            emailProvider.createTempMail();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content:
                                    const Text('New temporary email created!'),
                                backgroundColor: AppThemeColors.success,
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppThemeColors.accentGreen,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 32, vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 2,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.add_circle_outline),
                              const SizedBox(width: 8),
                              const Text(
                                'Generate New Email',
                                style: TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Active Temp Mails Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Active Temporary Emails',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? AppThemeColors.textPrimaryDark
                            : AppThemeColors.textPrimaryLight,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color:
                            isDark ? AppThemeColors.surfaceDark : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark
                              ? AppThemeColors.borderDark
                              : AppThemeColors.borderLight,
                        ),
                      ),
                      child: Text(
                        '${emailProvider.tempMails.length} active',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppThemeColors.accentPink,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Temp Mails List
              ...emailProvider.tempMails
                  .map((tempMail) => Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 8),
                        child: _buildTempMailCard(
                            context, tempMail, emailProvider, isDark),
                      ))
                  .toList(),

              // Empty State
              if (emailProvider.tempMails.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 60),
                  child: Column(
                    children: [
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          gradient: HomepageTheme.orangeRedGradient,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.email_outlined,
                          size: 50,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'No temporary emails yet',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppThemeColors.textSecondaryDark
                              : AppThemeColors.textSecondaryLight,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Generate your first temporary email above',
                        style: GoogleFonts.poppins(
                          color: isDark
                              ? AppThemeColors.textSecondaryDark
                              : AppThemeColors.textSecondaryLight,
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 100),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildTempMailCard(BuildContext context, TempMail tempMail,
      EmailProvider provider, bool isDark) {
    final timeLeft = tempMail.expiresAt.difference(DateTime.now());
    final hoursLeft = timeLeft.inHours;
    final minutesLeft = timeLeft.inMinutes.remainder(60);

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
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: HomepageTheme.blueCyanGradient,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.alternate_email,
                    size: 20,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tempMail.email,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppThemeColors.textPrimaryDark
                              : AppThemeColors.textPrimaryLight,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.lock_outline,
                            size: 14,
                            color: isDark
                                ? AppThemeColors.textSecondaryDark
                                : AppThemeColors.textSecondaryLight,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Password: ${tempMail.password}',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
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
                PopupMenuButton<String>(
                  icon: Icon(
                    Icons.more_vert,
                    color: isDark
                        ? AppThemeColors.textSecondaryDark
                        : AppThemeColors.textSecondaryLight,
                  ),
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: 'copy',
                      child: Row(
                        children: [
                          const Icon(Icons.copy, size: 20),
                          const SizedBox(width: 8),
                          Text('Copy Email'),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'refresh',
                      child: Row(
                        children: [
                          const Icon(Icons.refresh, size: 20),
                          const SizedBox(width: 8),
                          Text('Refresh'),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          const Icon(Icons.delete,
                              size: 20, color: AppThemeColors.error),
                          const SizedBox(width: 8),
                          const Text('Delete',
                              style: TextStyle(color: AppThemeColors.error)),
                        ],
                      ),
                    ),
                  ],
                  onSelected: (value) {
                    if (value == 'copy') {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Email copied to clipboard'),
                        ),
                      );
                    } else if (value == 'delete') {
                      provider.deleteTempMail(tempMail.inboxId);
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppThemeColors.primaryBlue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.email_outlined,
                        size: 14,
                        color: AppThemeColors.primaryBlue,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${tempMail.messageCount} messages',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppThemeColors.primaryBlue,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: hoursLeft < 1
                        ? AppThemeColors.error.withOpacity(0.1)
                        : AppThemeColors.accentAmber.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.timer_outlined,
                        size: 14,
                        color: hoursLeft < 1
                            ? AppThemeColors.error
                            : AppThemeColors.accentAmber,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        hoursLeft > 0
                            ? 'Expires in $hoursLeft h $minutesLeft m'
                            : 'Expires in $minutesLeft m',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: hoursLeft < 1
                              ? AppThemeColors.error
                              : AppThemeColors.accentAmber,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      // View inbox
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppThemeColors.primaryBlue,
                      side: BorderSide(
                          color: AppThemeColors.primaryBlue.withOpacity(0.3)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('View Inbox'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pushNamed(context, '/compose', arguments: {
                        'from': tempMail.email,
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppThemeColors.primaryBlue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Compose'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showInfoDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About Temporary Mail'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildInfoItem(Icons.security, 'Protect your privacy'),
              _buildInfoItem(Icons.timer, 'Expire in 24 hours'),
              _buildInfoItem(Icons.block, 'Avoid spam and newsletters'),
              _buildInfoItem(Icons.email, 'Receive emails normally'),
              const SizedBox(height: 16),
              const Text(
                'Perfect for signing up to websites where you don\'t want to use your personal email.',
                style: TextStyle(fontStyle: FontStyle.italic),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppThemeColors.primaryBlue),
          const SizedBox(width: 12),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
