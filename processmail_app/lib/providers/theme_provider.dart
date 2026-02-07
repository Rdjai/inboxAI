import 'package:flutter/material.dart';

class AppThemeColors {
  // Main brand colors (from your homepage)
  static const Color primaryBlue = Color(0xFF2563EB); // Blue 600
  static const Color primaryPurple = Color(0xFF7C3AED); // Purple 600

  // Gradient colors for buttons/app bars
  static const Color gradientStart = Color(0xFF2563EB); // Blue 600
  static const Color gradientEnd = Color(0xFF7C3AED); // Purple 600

  // Accent colors from homepage
  static const Color accentGreen =
      Color(0xFF10B981); // Emerald 500 (for success/live badges)
  static const Color accentEmerald = Color(0xFF059669); // Emerald 600
  static const Color accentAmber =
      Color(0xFFF59E0B); // Amber 500 (for development status)
  static const Color accentOrange = Color(0xFFF97316); // Orange 500
  static const Color accentPink = Color(0xFFEC4899); // Pink 500
  static const Color accentCyan = Color(0xFF06B6D4); // Cyan 500

  // Background colors
  static const Color backgroundLight = Color(0xFFF9FAFB); // Gray 50
  static const Color backgroundDark = Color(0xFF111827); // Gray 900

  // Surface colors
  static const Color surfaceLight = Color(0xFFFFFFFF); // White
  static const Color surfaceDark = Color(0xFF1F2937); // Gray 800

  // Text colors
  static const Color textPrimaryLight = Color(0xFF111827); // Gray 900
  static const Color textSecondaryLight = Color(0xFF6B7280); // Gray 500
  static const Color textPrimaryDark = Color(0xFFF9FAFB); // Gray 50
  static const Color textSecondaryDark = Color(0xFFD1D5DB); // Gray 300

  // Border colors
  static const Color borderLight = Color(0xFFE5E7EB); // Gray 200
  static const Color borderDark = Color(0xFF374151); // Gray 700

  // Status colors
  static const Color success = Color(0xFF10B981); // Green 500
  static const Color warning = Color(0xFFF59E0B); // Amber 500
  static const Color error = Color(0xFFEF4444); // Red 500
  static const Color info = Color(0xFF3B82F6); // Blue 500

  // Social colors (if needed)
  static const Color githubDark = Color(0xFF181717);
  static const Color githubLight = Color(0xFFF5F5F5);
  static const Color googleBlue = Color(0xFF4285F4);
  static const Color googleRed = Color(0xFFDB4437);
  static const Color googleYellow = Color(0xFFF4B400);
  static const Color googleGreen = Color(0xFF0F9D58);
}

class HomepageTheme {
  // Custom gradients from your homepage
  static LinearGradient primaryGradient = const LinearGradient(
    colors: [AppThemeColors.gradientStart, AppThemeColors.gradientEnd],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static LinearGradient greenGradient = const LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF059669)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static LinearGradient amberGradient = const LinearGradient(
    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  // Homepage screenshot gradients
  static LinearGradient blueCyanGradient = const LinearGradient(
    colors: [Color(0xFF3B82F6), Color(0xFF06B6D4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient purplePinkGradient = const LinearGradient(
    colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient greenEmeraldGradient = const LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF047857)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient orangeRedGradient = const LinearGradient(
    colors: [Color(0xFFF97316), Color(0xFFDC2626)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // App bar style from homepage
  static AppBarTheme getAppBarTheme(bool isDark) {
    return AppBarTheme(
      backgroundColor: isDark ? AppThemeColors.surfaceDark : Colors.white,
      foregroundColor: isDark
          ? AppThemeColors.textPrimaryDark
          : AppThemeColors.textPrimaryLight,
      elevation: isDark ? 2 : 2,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: isDark
            ? AppThemeColors.textPrimaryDark
            : AppThemeColors.textPrimaryLight,
      ),
      iconTheme: IconThemeData(
        color: isDark
            ? AppThemeColors.textPrimaryDark
            : AppThemeColors.textPrimaryLight,
      ),
    );
  }

  // Button style matching homepage CTA buttons
  static ButtonStyle primaryButtonStyle(bool isDark) {
    return ElevatedButton.styleFrom(
      backgroundColor:
          isDark ? AppThemeColors.primaryPurple : AppThemeColors.primaryBlue,
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
      elevation: 2,
      shadowColor: isDark
          ? Colors.black.withValues(alpha: 0.3)
          : Colors.blue.withValues(alpha: 0.3),
    );
  }

  static ButtonStyle secondaryButtonStyle(bool isDark) {
    return ElevatedButton.styleFrom(
      backgroundColor: isDark ? AppThemeColors.surfaceDark : Colors.white,
      foregroundColor: isDark
          ? AppThemeColors.textPrimaryDark
          : AppThemeColors.textPrimaryLight,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color:
              isDark ? AppThemeColors.borderDark : AppThemeColors.borderLight,
          width: 2,
        ),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
      elevation: 0,
    );
  }

  static ButtonStyle gradientButtonStyle() {
    return ElevatedButton.styleFrom(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
      elevation: 2,
      shadowColor: Colors.blue.withValues(alpha: 0.3),
    ).copyWith(
      backgroundColor: WidgetStateProperty.all(Colors.transparent),
      foregroundColor: WidgetStateProperty.all(Colors.white),
      overlayColor:
          WidgetStateProperty.all(Colors.white.withValues(alpha: 0.1)),
    );
  }

  // Card style matching homepage feature cards
  static CardThemeData getCardTheme(bool isDark) {
    return CardThemeData(
      color: isDark ? AppThemeColors.surfaceDark : Colors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color:
              isDark ? AppThemeColors.borderDark : AppThemeColors.borderLight,
          width: 1,
        ),
      ),
      margin: const EdgeInsets.all(8),
    );
  }

  static DialogThemeData getDialogTheme(bool isDark) {
    return DialogThemeData(
      backgroundColor: isDark ? AppThemeColors.surfaceDark : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      elevation: 4,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: isDark
            ? AppThemeColors.textPrimaryDark
            : AppThemeColors.textPrimaryLight,
      ),
      contentTextStyle: TextStyle(
        fontSize: 14,
        color: isDark
            ? AppThemeColors.textSecondaryDark
            : AppThemeColors.textSecondaryLight,
      ),
    );
  }

  // Input decoration matching homepage style
  static InputDecorationTheme getInputDecorationTheme(bool isDark) {
    return InputDecorationTheme(
      filled: true,
      fillColor: isDark ? AppThemeColors.surfaceDark : Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color:
              isDark ? AppThemeColors.borderDark : AppThemeColors.borderLight,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color:
              isDark ? AppThemeColors.borderDark : AppThemeColors.borderLight,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: isDark
              ? AppThemeColors.primaryPurple
              : AppThemeColors.primaryBlue,
          width: 2,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppThemeColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppThemeColors.error, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      hintStyle: TextStyle(
        color: isDark
            ? AppThemeColors.textSecondaryDark
            : AppThemeColors.textSecondaryLight,
      ),
      labelStyle: TextStyle(
        color: isDark
            ? AppThemeColors.textSecondaryDark
            : AppThemeColors.textSecondaryLight,
      ),
    );
  }
}

class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.light;

  ThemeMode get themeMode => _themeMode;

  set themeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }

  ThemeData get lightTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,

        // Color scheme matching homepage
        colorScheme: ColorScheme.light(
          primary: AppThemeColors.primaryBlue,
          secondary: AppThemeColors.primaryPurple,
          surface: Colors.white,
          error: AppThemeColors.error,
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          onSurface: AppThemeColors.textPrimaryLight,
          onError: Colors.white,
        ),

        // Components matching homepage design
        appBarTheme: HomepageTheme.getAppBarTheme(false),

        elevatedButtonTheme: ElevatedButtonThemeData(
          style: HomepageTheme.primaryButtonStyle(false),
        ),

        outlinedButtonTheme: OutlinedButtonThemeData(
          style: HomepageTheme.secondaryButtonStyle(false),
        ),

        cardTheme: HomepageTheme.getCardTheme(false),

        inputDecorationTheme: HomepageTheme.getInputDecorationTheme(false),

        // Floating Action Button
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: AppThemeColors.primaryBlue,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
        ),

        // Dialog Theme
        dialogTheme: HomepageTheme.getDialogTheme(false),

        // SnackBar Theme
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppThemeColors.textPrimaryLight,
          contentTextStyle: const TextStyle(color: Colors.white),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),

        // Bottom Navigation Bar
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: Colors.white,
          selectedItemColor: AppThemeColors.primaryBlue,
          unselectedItemColor: AppThemeColors.textSecondaryLight,
          showUnselectedLabels: true,
          elevation: 2,
        ),

        // Text Theme
        textTheme: const TextTheme(
          displayLarge: TextStyle(
            fontSize: 57,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textPrimaryLight,
          ),
          displayMedium: TextStyle(
            fontSize: 45,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textPrimaryLight,
          ),
          displaySmall: TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textPrimaryLight,
          ),
          headlineLarge: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryLight,
          ),
          headlineMedium: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryLight,
          ),
          headlineSmall: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryLight,
          ),
          titleLarge: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryLight,
          ),
          titleMedium: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryLight,
          ),
          titleSmall: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryLight,
          ),
          bodyLarge: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textPrimaryLight,
          ),
          bodyMedium: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textSecondaryLight,
          ),
          bodySmall: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textSecondaryLight,
          ),
          labelLarge: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryLight,
          ),
          labelMedium: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textSecondaryLight,
          ),
          labelSmall: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textSecondaryLight,
          ),
        ),
      );

  ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,

        // Color scheme matching homepage dark mode
        colorScheme: ColorScheme.dark(
          primary: AppThemeColors.primaryPurple,
          secondary: AppThemeColors.primaryBlue,
          surface: AppThemeColors.surfaceDark,
          error: AppThemeColors.error,
          onPrimary: AppThemeColors.textPrimaryDark,
          onSecondary: AppThemeColors.textPrimaryDark,
          onSurface: AppThemeColors.textPrimaryDark,
          onError: AppThemeColors.textPrimaryDark,
        ),

        // Components matching homepage design
        appBarTheme: HomepageTheme.getAppBarTheme(true),

        elevatedButtonTheme: ElevatedButtonThemeData(
          style: HomepageTheme.primaryButtonStyle(true),
        ),

        outlinedButtonTheme: OutlinedButtonThemeData(
          style: HomepageTheme.secondaryButtonStyle(true),
        ),

        cardTheme: HomepageTheme.getCardTheme(true),

        inputDecorationTheme: HomepageTheme.getInputDecorationTheme(true),

        // Floating Action Button
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: AppThemeColors.primaryPurple,
          foregroundColor: AppThemeColors.textPrimaryDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
        ),

        // Dialog Theme
        dialogTheme: HomepageTheme.getDialogTheme(true),

        // SnackBar Theme
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppThemeColors.surfaceDark,
          contentTextStyle: TextStyle(color: AppThemeColors.textPrimaryDark),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),

        // Bottom Navigation Bar
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: AppThemeColors.surfaceDark,
          selectedItemColor: AppThemeColors.primaryPurple,
          unselectedItemColor: AppThemeColors.textSecondaryDark,
          showUnselectedLabels: true,
          elevation: 2,
        ),

        // Text Theme
        textTheme: const TextTheme(
          displayLarge: TextStyle(
            fontSize: 57,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textPrimaryDark,
          ),
          displayMedium: TextStyle(
            fontSize: 45,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textPrimaryDark,
          ),
          displaySmall: TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textPrimaryDark,
          ),
          headlineLarge: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryDark,
          ),
          headlineMedium: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryDark,
          ),
          headlineSmall: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryDark,
          ),
          titleLarge: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryDark,
          ),
          titleMedium: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryDark,
          ),
          titleSmall: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryDark,
          ),
          bodyLarge: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textPrimaryDark,
          ),
          bodyMedium: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textSecondaryDark,
          ),
          bodySmall: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AppThemeColors.textSecondaryDark,
          ),
          labelLarge: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textPrimaryDark,
          ),
          labelMedium: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textSecondaryDark,
          ),
          labelSmall: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppThemeColors.textSecondaryDark,
          ),
        ),
      );

  void toggleTheme() {
    _themeMode =
        _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }
}
