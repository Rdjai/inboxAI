import 'package:flutter/material.dart';
import 'package:processmail_app/config/app_config.dart';
import 'package:processmail_app/services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoggedIn = false;
  bool _isLoading = false;
  String? _token;
  String? _currentUserEmail;
  String? _currentUserName;
  String? _error;

  bool get isLoggedIn => _isLoggedIn;
  bool get isLoading => _isLoading;
  String? get token => _token;
  String? get currentUserEmail => _currentUserEmail;
  String? get currentUserName => _currentUserName;
  String? get error => _error;

  Future<bool> bootstrap() async {
    if (_isLoading) return _isLoggedIn;

    if (AppConfig.bootstrapToken.isNotEmpty) {
      return loginWithToken(AppConfig.bootstrapToken);
    }

    if (AppConfig.bootstrapEmail.isNotEmpty &&
        AppConfig.bootstrapPassword.isNotEmpty) {
      return loginWithPassword(
        email: AppConfig.bootstrapEmail,
        password: AppConfig.bootstrapPassword,
      );
    }

    return false;
  }

  Future<bool> loginWithToken(String token) async {
    _setLoading(true);
    _error = null;
    try {
      ApiService.instance.setToken(token);
      final profileRes = await ApiService.instance.getProfile();
      final profileData = _extractData(profileRes);
      _token = token;
      _isLoggedIn = true;
      _currentUserEmail = profileData?['email']?.toString();
      _currentUserName = profileData?['name']?.toString();
      return true;
    } catch (e) {
      _error = e.toString();
      _clearState();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> loginWithPassword({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    _error = null;
    try {
      final loginRes = await ApiService.instance.login(
        email: email,
        password: password,
      );
      final data = _extractData(loginRes);
      final token = data?['token']?.toString() ?? '';

      if (token.isEmpty) {
        throw Exception('Login succeeded but token is missing');
      }

      ApiService.instance.setToken(token);
      _token = token;
      _isLoggedIn = true;
      _currentUserEmail = data?['user']?['email']?.toString() ?? email;
      _currentUserName =
          data?['user']?['name']?.toString() ?? email.split('@').first;
      return true;
    } catch (e) {
      _error = e.toString();
      _clearState();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> login(String email, String name) async {
    _currentUserEmail = email;
    _currentUserName = name;
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void logout() {
    _clearState();
    notifyListeners();
  }

  void _clearState() {
    _isLoggedIn = false;
    _token = null;
    _currentUserEmail = null;
    _currentUserName = null;
    ApiService.instance.setToken(null);
  }

  Map<String, dynamic>? _extractData(Map<String, dynamic>? response) {
    if (response == null) return null;
    final data = response['data'];
    if (data is Map<String, dynamic>) return data;
    if (response['success'] == true && data is Map) {
      return data.cast<String, dynamic>();
    }
    return response;
  }

  Future<bool> connectEmailAccount({
    required String email,
    required String password,
    required String serverType,
  }) async {
    return loginWithPassword(email: email, password: password);
  }
}
