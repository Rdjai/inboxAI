import 'package:flutter/material.dart';
import 'package:processmail_app/models/email_model.dart';
import 'package:provider/provider.dart';
import 'package:processmail_app/screens/splash_screen.dart';
import 'package:processmail_app/screens/home_screen.dart';
import 'package:processmail_app/screens/temp_mail_screen.dart';
import 'package:processmail_app/screens/email_detail_screen.dart';
import 'package:processmail_app/screens/compose_screen.dart';
import 'package:processmail_app/screens/all_mail_screen.dart';
import 'package:processmail_app/screens/inbox_screen.dart';
import 'package:processmail_app/screens/settings_screen.dart';
import 'package:processmail_app/providers/auth_provider.dart';
import 'package:processmail_app/providers/email_provider.dart';
import 'package:processmail_app/providers/theme_provider.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const ProcessMailApp());
}

class ProcessMailApp extends StatelessWidget {
  const ProcessMailApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, EmailProvider>(
          create: (_) => EmailProvider(),
          update: (_, authProvider, emailProvider) {
            final provider = emailProvider ?? EmailProvider();
            provider.bindAuth(authProvider);
            return provider;
          },
        ),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'ProcessMail',
            debugShowCheckedModeBanner: false,
            theme: themeProvider.lightTheme,
            darkTheme: themeProvider.darkTheme,
            themeMode: themeProvider.themeMode,
            initialRoute: '/splash',
            routes: {
              '/splash': (context) => const SplashScreen(),
              '/home': (context) => const MainNavigationScreen(),
              '/inbox': (context) => const InboxScreen(),
              '/temp-mail': (context) => const TempMailScreen(),
              '/compose': (context) => const ComposeScreen(),
              '/all-mail': (context) => const AllMailScreen(),
              '/settings': (context) => const SettingsScreen(),
            },
            onGenerateRoute: (settings) {
              if (settings.name == '/email-detail') {
                final email = settings.arguments as Email;
                return MaterialPageRoute(
                  builder: (context) => EmailDetailScreen(email: email),
                );
              }
              return null;
            },
          );
        },
      ),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;
  final PageController _pageController = PageController();

  // Navigation screens
  final List<Widget> _screens = [
    const HomeScreen(),
    const InboxScreen(),
    const TempMailScreen(),
    const SettingsScreen(),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return Scaffold(
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: _screens,
        onPageChanged: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color:
              isDark ? AppThemeColors.surfaceDark : AppThemeColors.surfaceLight,
          border: Border(
            top: BorderSide(
              color: isDark
                  ? AppThemeColors.borderDark
                  : AppThemeColors.borderLight,
              width: 1,
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              spreadRadius: 1,
            ),
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 70,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(
                  0,
                  Icons.home_outlined,
                  Icons.home,
                  'Home',
                  isDark,
                ),
                _buildNavItem(
                  1,
                  Icons.inbox_outlined,
                  Icons.inbox,
                  'Inbox',
                  isDark,
                ),
                _buildNavItem(
                  2,
                  Icons.timer_outlined,
                  Icons.timer,
                  'Temp Mail',
                  isDark,
                ),
                _buildNavItem(
                  3,
                  Icons.settings_outlined,
                  Icons.settings,
                  'Settings',
                  isDark,
                ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: _selectedIndex == 0 || _selectedIndex == 1
          ? SizedBox(
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
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }

  Widget _buildNavItem(
    int index,
    IconData icon,
    IconData activeIcon,
    String label,
    bool isDark,
  ) {
    final isSelected = _selectedIndex == index;

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            setState(() {
              _selectedIndex = index;
              _pageController.jumpToPage(index);
            });
          },
          highlightColor: Colors.transparent,
          splashColor: Colors.transparent,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: isSelected
                    ? BoxDecoration(
                        gradient: HomepageTheme.primaryGradient,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppThemeColors.primaryBlue.withOpacity(0.3),
                            blurRadius: 8,
                            spreadRadius: 2,
                          ),
                        ],
                      )
                    : null,
                child: Icon(
                  isSelected ? activeIcon : icon,
                  size: isSelected ? 22 : 24,
                  color: isSelected
                      ? Colors.white
                      : (isDark
                          ? AppThemeColors.textSecondaryDark
                          : AppThemeColors.textSecondaryLight),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected
                      ? (isDark
                          ? AppThemeColors.primaryPurple
                          : AppThemeColors.primaryBlue)
                      : (isDark
                          ? AppThemeColors.textSecondaryDark
                          : AppThemeColors.textSecondaryLight),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
