import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:processmail_app/providers/email_provider.dart';
import 'package:processmail_app/providers/auth_provider.dart';
import 'package:processmail_app/providers/theme_provider.dart';
import 'package:processmail_app/models/email_model.dart';
import 'package:processmail_app/widgets/email_card.dart';
import 'package:processmail_app/widgets/category_chip.dart';
import 'package:processmail_app/widgets/account_card.dart';
import 'package:processmail_app/screens/email_detail_screen.dart';
import 'package:processmail_app/screens/compose_screen.dart';
import 'package:processmail_app/screens/all_mail_screen.dart';
import 'package:processmail_app/screens/inbox_screen.dart';
import 'package:processmail_app/screens/temp_mail_screen.dart';
import 'package:processmail_app/screens/settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  static const double _expandedHeaderHeight = 270.0; // 1.5x of 180
  static const double _searchHeaderHeight = 150.0; // 1.5x of 100
  late AnimationController _waveController;
  late Animation<double> _waveAnimation;
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  final ScrollController _scrollController = ScrollController();
  double _scrollOffset = 0;

  @override
  void initState() {
    super.initState();
    _waveController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat(reverse: true);
    _waveAnimation = CurvedAnimation(
      parent: _waveController,
      curve: Curves.easeInOut,
    );

    _scrollController.addListener(() {
      setState(() {
        _scrollOffset = _scrollController.offset;
      });
    });
  }

  @override
  void dispose() {
    _waveController.dispose();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final emailProvider = Provider.of<EmailProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.themeMode == ThemeMode.dark;
    final displayName = authProvider.currentUserName ?? 'Guest';

    return Scaffold(
      backgroundColor: isDark
          ? AppThemeColors.backgroundDark
          : AppThemeColors.backgroundLight,
      body: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollUpdateNotification) {
            setState(() {
              _scrollOffset = _scrollController.offset;
            });
          }
          return false;
        },
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // Show minimal app bar when scrolled, full gradient when at top
            SliverAppBar(
              floating: false,
              pinned: true,
              snap: false,
              expandedHeight:
                  _isSearching ? _searchHeaderHeight : _expandedHeaderHeight,
              backgroundColor: _scrollOffset > 50
                  ? (isDark ? AppThemeColors.surfaceDark : Colors.white)
                  : Colors.transparent,
              elevation: _scrollOffset > 50 ? 4 : 0,
              shape: _scrollOffset > 50
                  ? const ContinuousRectangleBorder(
                      borderRadius: BorderRadius.vertical(
                        bottom: Radius.circular(20),
                      ),
                    )
                  : null,
              flexibleSpace: FlexibleSpaceBar(
                collapseMode: CollapseMode.pin,
                background: _isSearching
                    ? null
                    : Container(
                        decoration: BoxDecoration(
                          gradient: HomepageTheme.primaryGradient,
                        ),
                        child: SafeArea(
                          bottom: false,
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(24, 02, 24, 20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                // Welcome Text
                                AnimatedBuilder(
                                  animation: _waveAnimation,
                                  builder: (context, child) {
                                    return Transform.translate(
                                      offset: Offset(
                                          0, _waveAnimation.value * 2 - 1),
                                      child: child,
                                    );
                                  },
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Welcome back,',
                                        style: GoogleFonts.poppins(
                                          fontSize: 14,
                                          color: Colors.white.withOpacity(0.9),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '$displayName! 👋',
                                        style: GoogleFonts.poppins(
                                          fontSize: 28,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Quick Stats
                                SizedBox(
                                  height: 120,
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      _buildStatItem(
                                        '${emailProvider.unreadCount}',
                                        'Unread',
                                        Colors.white,
                                        Icons.mark_email_unread_outlined,
                                      ),
                                      _buildStatItem(
                                        '${emailProvider.starredCount}',
                                        'Starred',
                                        Colors.white,
                                        Icons.star_border_outlined,
                                      ),
                                      _buildStatItem(
                                        '${emailProvider.importantCount}',
                                        'Important',
                                        Colors.white,
                                        Icons.label_important_outline,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  emailProvider.isServerConnected
                                      ? 'Live sync active'
                                      : 'Live sync not connected',
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    color: Colors.white.withOpacity(0.85),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
              ),
              title: _isSearching
                  ? Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color:
                            isDark ? AppThemeColors.surfaceDark : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark
                              ? AppThemeColors.borderDark
                              : AppThemeColors.borderLight,
                        ),
                      ),
                      child: TextField(
                        controller: _searchController,
                        autofocus: true,
                        style: GoogleFonts.poppins(
                          color: isDark
                              ? AppThemeColors.textPrimaryDark
                              : AppThemeColors.textPrimaryLight,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Search emails...',
                          hintStyle: GoogleFonts.poppins(
                            color: isDark
                                ? AppThemeColors.textSecondaryDark
                                : AppThemeColors.textSecondaryLight,
                          ),
                          border: InputBorder.none,
                          prefixIcon: Icon(
                            Icons.search,
                            color: isDark
                                ? AppThemeColors.textSecondaryDark
                                : AppThemeColors.textSecondaryLight,
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              Icons.close,
                              color: isDark
                                  ? AppThemeColors.textSecondaryDark
                                  : AppThemeColors.textSecondaryLight,
                            ),
                            onPressed: () {
                              setState(() {
                                _isSearching = false;
                                _searchController.clear();
                                emailProvider.searchEmails('');
                              });
                            },
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                              vertical: 0, horizontal: 12),
                        ),
                        onChanged: (value) {
                          emailProvider.searchEmails(value);
                        },
                      ),
                    )
                  : _scrollOffset > 50
                      ? Text(
                          'ProcessMail',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                            color: isDark
                                ? AppThemeColors.textPrimaryDark
                                : AppThemeColors.textPrimaryLight,
                          ),
                        )
                      : null,
              actions: _scrollOffset > 50 || _isSearching
                  ? [
                      if (!_isSearching)
                        IconButton(
                          icon: Icon(
                            Icons.search,
                            color: isDark
                                ? AppThemeColors.textPrimaryDark
                                : AppThemeColors.textPrimaryLight,
                          ),
                          onPressed: () {
                            setState(() {
                              _isSearching = true;
                            });
                          },
                        ),
                      IconButton(
                        icon: Icon(
                          Icons.notifications_outlined,
                          color: isDark
                              ? AppThemeColors.textPrimaryDark
                              : AppThemeColors.textPrimaryLight,
                        ),
                        onPressed: () {},
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(20),
                          onTap: () {
                            themeProvider.toggleTheme();
                          },
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              gradient: isDark
                                  ? HomepageTheme.blueCyanGradient
                                  : HomepageTheme.purplePinkGradient,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 10,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: Icon(
                              isDark ? Icons.light_mode : Icons.dark_mode,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                    ]
                  : [],
            ),

            // Main Content - Starts with Accounts when scrolled
            SliverList(
              delegate: SliverChildListDelegate([
                // Accounts Section
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Your Accounts',
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? AppThemeColors.textPrimaryDark
                                  : AppThemeColors.textPrimaryLight,
                            ),
                          ),
                          InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: () {},
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isDark
                                      ? AppThemeColors.borderDark
                                      : AppThemeColors.borderLight,
                                ),
                              ),
                              child: Text(
                                'Manage',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: isDark
                                      ? AppThemeColors.primaryPurple
                                      : AppThemeColors.primaryBlue,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ConstrainedBox(
                        constraints: const BoxConstraints(
                          maxHeight: 170,
                        ),
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: emailProvider.accounts.length,
                          itemBuilder: (context, index) {
                            final account = emailProvider.accounts[index];
                            return Padding(
                              padding: EdgeInsets.only(
                                  right:
                                      index == emailProvider.accounts.length - 1
                                          ? 0
                                          : 12),
                              child: SizedBox(
                                width: 200,
                                child: AccountCard(account: account),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // Categories Section
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Categories',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppThemeColors.textPrimaryDark
                              : AppThemeColors.textPrimaryLight,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: _getMainCategories()
                              .map((category) => Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: CategoryChip(category: category),
                                  ))
                              .toList(),
                        ),
                      ),
                    ],
                  ),
                ),

                // Recent Emails Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Recent Emails',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppThemeColors.textPrimaryDark
                              : AppThemeColors.textPrimaryLight,
                        ),
                      ),
                      InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () {
                          Navigator.pushNamed(context, '/all-mail');
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            gradient: HomepageTheme.greenGradient,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Text(
                                'View All',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.arrow_forward,
                                size: 14,
                                color: Colors.white,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Emails List
                if (emailProvider.emails.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 60),
                    child: Center(
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
                            'No emails found',
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
                            'Your inbox is empty',
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
                  )
                else
                  ...emailProvider.emails
                      .map((email) => Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 6),
                            child: EmailCard(email: email),
                          ))
                      .toList(),

                const SizedBox(height: 80), // Extra space for FAB
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(
      String value, String label, Color color, IconData icon) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.2)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 11,
                color: color.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<EmailCategory> _getMainCategories() {
    return [
      EmailCategory.inbox,
      EmailCategory.starred,
      EmailCategory.important,
      EmailCategory.sent,
      EmailCategory.draft,
      EmailCategory.promotions,
      EmailCategory.social,
    ];
  }
}
