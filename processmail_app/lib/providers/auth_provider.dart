import 'package:flutter/material.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoggedIn = false;
  String? _currentUserEmail;
  String? _currentUserName;

  bool get isLoggedIn => _isLoggedIn;
  String? get currentUserEmail => _currentUserEmail;
  String? get currentUserName => _currentUserName;

  void login(String email, String name) {
    _isLoggedIn = true;
    _currentUserEmail = email;
    _currentUserName = name;
    notifyListeners();
  }

  void logout() {
    _isLoggedIn = false;
    _currentUserEmail = null;
    _currentUserName = null;
    notifyListeners();
  }

  // Simulate email account connection
  Future<bool> connectEmailAccount({
    required String email,
    required String password,
    required String serverType,
  }) async {
    // Simulate API call delay
    await Future.delayed(const Duration(seconds: 2));

    // In a real app, you would validate with actual email server
    if (email.isNotEmpty && password.isNotEmpty) {
      _isLoggedIn = true;
      _currentUserEmail = email;
      _currentUserName = email.split('@').first;
      notifyListeners();
      return true;
    }
    return false;
  }
}
