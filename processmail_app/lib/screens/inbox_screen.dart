import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:liquid_pull_to_refresh/liquid_pull_to_refresh.dart';
import 'package:processmail_app/providers/email_provider.dart';
import 'package:processmail_app/providers/theme_provider.dart';
import 'package:processmail_app/models/email_model.dart';
import 'package:processmail_app/widgets/email_card.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
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
    final inboxEmails = emailProvider.emails
        .where((email) => email.category == EmailCategory.inbox)
        .toList();

    return Scaffold(
      backgroundColor: isDark
          ? AppThemeColors.backgroundDark
          : AppThemeColors.backgroundLight,
      body: NestedScrollView(
        controller: _scrollController,
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          final isCollapsed = _scrollOffset > 50;
          return [
            // App Bar
            SliverAppBar(
              floating: true,
              pinned: true,
              expandedHeight: 210.0,
              backgroundColor: isCollapsed
                  ? (isDark
                      ? AppThemeColors.surfaceDark
                      : AppThemeColors.surfaceLight)
                  : Colors.transparent,
              elevation: isCollapsed ? 4 : 0,
              shape: isCollapsed
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
                    gradient: HomepageTheme.primaryGradient,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 60, 24, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          'Inbox',
                          style: GoogleFonts.poppins(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${inboxEmails.length} emails, ${inboxEmails.where((e) => !e.isRead).length} unread',
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
              title: isCollapsed
                  ? Text(
                      'Inbox',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                        color: isDark
                            ? AppThemeColors.textPrimaryDark
                            : AppThemeColors.textPrimaryLight,
                      ),
                    )
                  : null,
              actions: [
                IconButton(
                  icon: Icon(
                    Icons.search,
                    color: isCollapsed
                        ? (isDark
                            ? AppThemeColors.textPrimaryDark
                            : AppThemeColors.textPrimaryLight)
                        : Colors.white,
                  ),
                  onPressed: () {
                    showSearch(
                      context: context,
                      delegate:
                          EmailSearchDelegate(emailProvider: emailProvider),
                    );
                  },
                ),
                IconButton(
                  icon: Icon(
                    Icons.filter_list,
                    color: isCollapsed
                        ? (isDark
                            ? AppThemeColors.textPrimaryDark
                            : AppThemeColors.textPrimaryLight)
                        : Colors.white,
                  ),
                  onPressed: () {
                    _showFilterDialog(context);
                  },
                ),
              ],
            ),

            // Categories Sliver
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quick Filters',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
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
                        children: [
                          FilterChip(
                            selected: false,
                            onSelected: (_) {
                              emailProvider.searchEmails('unread');
                            },
                            label: Row(
                              children: [
                                Icon(Icons.mark_email_unread, size: 16),
                                SizedBox(width: 6),
                                Text('Unread'),
                              ],
                            ),
                            backgroundColor: isDark
                                ? AppThemeColors.surfaceDark
                                : Colors.white,
                            selectedColor: AppThemeColors.primaryBlue,
                            labelStyle: GoogleFonts.poppins(
                              fontSize: 13,
                              color: isDark
                                  ? AppThemeColors.textPrimaryDark
                                  : AppThemeColors.textPrimaryLight,
                            ),
                          ),
                          SizedBox(width: 8),
                          FilterChip(
                            selected: false,
                            onSelected: (_) {
                              emailProvider.searchEmails('starred');
                            },
                            label: Row(
                              children: [
                                Icon(Icons.star, size: 16, color: Colors.amber),
                                SizedBox(width: 6),
                                Text('Starred'),
                              ],
                            ),
                            backgroundColor: isDark
                                ? AppThemeColors.surfaceDark
                                : Colors.white,
                            selectedColor: Colors.amber,
                            labelStyle: GoogleFonts.poppins(
                              fontSize: 13,
                              color: isDark
                                  ? AppThemeColors.textPrimaryDark
                                  : AppThemeColors.textPrimaryLight,
                            ),
                          ),
                          SizedBox(width: 8),
                          FilterChip(
                            selected: false,
                            onSelected: (_) {
                              emailProvider.searchEmails('attachment');
                            },
                            label: Row(
                              children: [
                                Icon(Icons.attach_file, size: 16),
                                SizedBox(width: 6),
                                Text('With Files'),
                              ],
                            ),
                            backgroundColor: isDark
                                ? AppThemeColors.surfaceDark
                                : Colors.white,
                            selectedColor: AppThemeColors.accentGreen,
                            labelStyle: GoogleFonts.poppins(
                              fontSize: 13,
                              color: isDark
                                  ? AppThemeColors.textPrimaryDark
                                  : AppThemeColors.textPrimaryLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ];
        },
        body: LiquidPullToRefresh(
          onRefresh: () => emailProvider.refreshEmails(),
          color: AppThemeColors.primaryBlue,
          backgroundColor:
              isDark ? AppThemeColors.surfaceDark : AppThemeColors.surfaceLight,
          height: 150,
          animSpeedFactor: 2,
          showChildOpacityTransition: false,
          child: inboxEmails.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          gradient: HomepageTheme.blueCyanGradient,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.inbox_outlined,
                          size: 50,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Inbox is empty',
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
                        'No new emails in your inbox',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: isDark
                              ? AppThemeColors.textSecondaryDark
                              : AppThemeColors.textSecondaryLight,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.only(top: 8),
                  itemCount: inboxEmails.length,
                  itemBuilder: (context, index) {
                    final email = inboxEmails[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 6),
                      child: EmailCard(email: email),
                    );
                  },
                ),
        ),
      ),
      floatingActionButton: SizedBox(
        width: 60,
        height: 60,
        child: FloatingActionButton(
          onPressed: () {
            Navigator.pushNamed(context, '/compose');
          },
          backgroundColor: Colors.transparent,
          elevation: 8,
          child: Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: HomepageTheme.greenEmeraldGradient,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppThemeColors.accentGreen.withOpacity(0.3),
                  blurRadius: 15,
                  spreadRadius: 3,
                ),
              ],
            ),
            child: const Icon(Icons.edit, color: Colors.white, size: 26),
          ),
        ),
      ),
    );
  }

  void _showFilterDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Filter Emails'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.mark_email_unread),
              title: Text('Unread Only'),
              trailing: Switch(value: false, onChanged: (_) {}),
            ),
            ListTile(
              leading: Icon(Icons.star, color: Colors.amber),
              title: Text('Starred Only'),
              trailing: Switch(value: false, onChanged: (_) {}),
            ),
            ListTile(
              leading: Icon(Icons.attach_file),
              title: Text('With Attachments'),
              trailing: Switch(value: false, onChanged: (_) {}),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Apply Filters'),
          ),
        ],
      ),
    );
  }
}

class EmailSearchDelegate extends SearchDelegate {
  final EmailProvider emailProvider;

  EmailSearchDelegate({required this.emailProvider});

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      IconButton(
        icon: const Icon(Icons.clear),
        onPressed: () {
          query = '';
        },
      ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () {
        close(context, null);
      },
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    emailProvider.searchEmails(query);
    return _buildSearchResults(context);
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    emailProvider.searchEmails(query);
    return _buildSearchResults(context);
  }

  Widget _buildSearchResults(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return emailProvider.emails.isEmpty
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.search_off,
                  size: 64,
                  color: isDark
                      ? AppThemeColors.textSecondaryDark
                      : AppThemeColors.textSecondaryLight,
                ),
                const SizedBox(height: 16),
                Text(
                  'No emails found',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    color: isDark
                        ? AppThemeColors.textPrimaryDark
                        : AppThemeColors.textPrimaryLight,
                  ),
                ),
              ],
            ),
          )
        : ListView.builder(
            itemCount: emailProvider.emails.length,
            itemBuilder: (context, index) {
              final email = emailProvider.emails[index];
              return Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                child: EmailCard(email: email),
              );
            },
          );
  }
}
