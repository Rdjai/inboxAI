import 'package:flutter/material.dart';
import 'package:processmail_app/models/email_model.dart';
import 'package:processmail_app/providers/auth_provider.dart';
import 'package:processmail_app/services/api_service.dart';

class EmailProvider extends ChangeNotifier {
  List<Email> _emails = [];
  List<TempMail> _tempMails = [];
  List<MailAccount> _accounts = [];
  EmailCategory _currentCategory = EmailCategory.inbox;
  EmailLabel _currentLabel = EmailLabel.inbox;
  String _searchQuery = '';
  bool _isLoading = false;
  bool _isServerConnected = false;
  String? _error;
  String? _selectedAccountId;
  String? _authToken;

  List<Email> get emails => _filteredEmails;
  List<Email> get allEmails => _emails;
  List<TempMail> get tempMails => _tempMails;
  List<MailAccount> get accounts => _accounts;
  EmailCategory get currentCategory => _currentCategory;
  EmailLabel get currentLabel => _currentLabel;
  bool get isLoading => _isLoading;
  bool get isServerConnected => _isServerConnected;
  String? get error => _error;
  String? get selectedAccountId => _selectedAccountId;

  int get totalEmails => _emails.length;
  int get unreadCount => _emails.where((e) => !e.isRead).length;
  int get starredCount => _emails.where((e) => e.isStarred).length;
  int get importantCount => _emails.where((e) => e.isImportant).length;

  List<Email> get _filteredEmails {
    final byCategory = _emails.where((email) {
      if (_currentCategory == EmailCategory.starred) return email.isStarred;
      if (_currentCategory == EmailCategory.important) return email.isImportant;
      return email.category == _currentCategory;
    }).toList();

    if (_searchQuery.isEmpty) {
      return byCategory;
    }

    final normalized = _searchQuery.trim().toLowerCase();
    if (normalized == 'unread') {
      return byCategory.where((email) => !email.isRead).toList();
    }
    if (normalized == 'starred') {
      return byCategory.where((email) => email.isStarred).toList();
    }
    if (normalized == 'attachment' || normalized == 'attachments') {
      return byCategory.where((email) => email.hasAttachments).toList();
    }

    return byCategory
        .where((email) =>
            email.subject.toLowerCase().contains(normalized) ||
            email.sender.toLowerCase().contains(normalized) ||
            email.body.toLowerCase().contains(normalized) ||
            email.senderEmail.toLowerCase().contains(normalized))
        .toList();
  }

  void bindAuth(AuthProvider authProvider) {
    final token = authProvider.token;
    if (token == _authToken) return;

    _authToken = token;
    ApiService.instance.setToken(token);

    if (token == null || token.isEmpty) {
      _clearData();
      notifyListeners();
      return;
    }

    loadInitialData();
  }

  Future<void> loadInitialData() async {
    _setLoading(true);
    _error = null;
    try {
      await Future.wait([fetchAccounts(), fetchEmails()]);
      _isServerConnected = true;
    } catch (e) {
      _isServerConnected = false;
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchAccounts() async {
    try {
      final response = await ApiService.instance.getAccounts();
      final payload = _extractData(response);
      final rawAccounts = _extractList(payload, preferredKey: 'accounts');
      _accounts = rawAccounts.map(_mapAccount).toList();

      if (_accounts.isNotEmpty) {
        _selectedAccountId ??= _accounts.first.id;
      } else {
        _selectedAccountId = null;
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }

  Future<void> fetchEmails() async {
    try {
      final response = await ApiService.instance.getEmails(
        page: 1,
        limit: 200,
        accountId: _selectedAccountId,
      );
      final payload = _extractData(response);
      final rawEmails = _extractList(payload, preferredKey: 'emails');
      _emails = rawEmails.map(_mapEmail).toList()
        ..sort((a, b) => b.date.compareTo(a.date));
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }

  void setSelectedAccount(String? accountId) {
    _selectedAccountId = accountId;
    refreshEmails();
  }

  void logout() {
    _clearData();
    notifyListeners();
  }

  void _clearData() {
    _emails = [];
    _accounts = [];
    _tempMails = [];
    _selectedAccountId = null;
    _isServerConnected = false;
    _error = null;
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void setCategory(EmailCategory category) {
    _currentCategory = category;
    notifyListeners();
  }

  void setCurrentLabel(EmailLabel label) {
    _currentLabel = label;
    _currentCategory = _mapLabelToCategory(label);
    notifyListeners();
  }

  void searchEmails(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void toggleStar(String emailId) {
    final index = _emails.indexWhere((email) => email.id == emailId);
    if (index != -1) {
      _emails[index] = _emails[index].copyWith(isStarred: !_emails[index].isStarred);
      notifyListeners();
    }
  }

  void markAsRead(String emailId) {
    final index = _emails.indexWhere((email) => email.id == emailId);
    if (index != -1) {
      _emails[index] = _emails[index].copyWith(isRead: true);
      notifyListeners();
    }
  }

  void markAsImportant(String emailId) {
    final index = _emails.indexWhere((email) => email.id == emailId);
    if (index != -1) {
      _emails[index] = _emails[index].copyWith(
        isImportant: !_emails[index].isImportant,
      );
      notifyListeners();
    }
  }

  void deleteEmail(String emailId) {
    _emails.removeWhere((email) => email.id == emailId);
    notifyListeners();
  }

  void moveToCategory(String emailId, EmailCategory category) {
    final index = _emails.indexWhere((email) => email.id == emailId);
    if (index != -1) {
      _emails[index] = _emails[index].copyWith(category: category);
      notifyListeners();
    }
  }

  void createTempMail() {
    final newTempMail = TempMail(
      email: 'temp${_tempMails.length + 1}@processmail.temp',
      password: 'temp${DateTime.now().millisecondsSinceEpoch}',
      expiresAt: DateTime.now().add(const Duration(hours: 24)),
      messageCount: 0,
      inboxId: 'temp${_tempMails.length + 1}',
    );
    _tempMails.add(newTempMail);
    notifyListeners();
  }

  void deleteTempMail(String inboxId) {
    _tempMails.removeWhere((mail) => mail.inboxId == inboxId);
    notifyListeners();
  }

  Future<void> refreshEmails() async {
    _setLoading(true);
    _error = null;
    try {
      await fetchEmails();
      _isServerConnected = true;
    } catch (_) {
      _isServerConnected = false;
    } finally {
      _setLoading(false);
    }
  }

  MailAccount _mapAccount(Map<String, dynamic> data) {
    final id = _asString(data['_id']) ?? _asString(data['id']) ?? '';
    final email = _asString(data['email']) ?? '';
    final name = _asString(data['name']) ??
        (email.contains('@') ? email.split('@').first : 'Account');
    final provider = _asString(data['provider']) ?? 'custom';
    final unreadCount = _asInt(data['unreadCount']) ??
        _asInt(data['statistics']?['unreadEmails']) ??
        0;
    return MailAccount(
      id: id,
      name: name,
      email: email,
      avatar: _initials(name),
      provider: provider,
      unreadCount: unreadCount,
    );
  }

  Email _mapEmail(Map<String, dynamic> data) {
    final id = _asString(data['_id']) ??
        _asString(data['id']) ??
        DateTime.now().millisecondsSinceEpoch.toString();
    final senderEmail = _extractEmail(_asString(data['fromAddress']) ?? '');
    final sender = _extractName(_asString(data['fromAddress']) ?? senderEmail);
    final subject = _asString(data['subject']) ?? '(No Subject)';
    final body = _asString(data['bodyText']) ?? _asString(data['body']) ?? '';
    final createdRaw = _asString(data['createdAt']) ??
        _asString(data['date']) ??
        DateTime.now().toIso8601String();
    final date = DateTime.tryParse(createdRaw) ?? DateTime.now();
    final categoryRaw = _asString(data['category']) ?? '';
    final statusRaw = (_asString(data['status']) ?? 'NEW').toUpperCase();
    final priorityRaw = (_asString(data['priority']) ?? 'LOW').toUpperCase();
    final hasAttachments = data['metadata']?['hasAttachments'] == true;

    return Email(
      id: id,
      sender: sender,
      senderEmail: senderEmail.isEmpty ? sender : senderEmail,
      senderAvatar: _initials(sender),
      subject: subject,
      body: body,
      preview: body.length > 120 ? '${body.substring(0, 120)}...' : body,
      date: date,
      isRead: statusRaw != 'NEW',
      isStarred: statusRaw == 'APPROVED',
      isImportant: priorityRaw == 'HIGH' || priorityRaw == 'URGENT',
      hasAttachments: hasAttachments,
      attachments: const [],
      priority: _mapPriority(priorityRaw),
      category: _mapCategory(statusRaw, categoryRaw),
    );
  }

  List<Map<String, dynamic>> _extractList(
    dynamic payload, {
    String? preferredKey,
  }) {
    if (payload is List) {
      return payload.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList();
    }
    if (payload is Map<String, dynamic>) {
      if (preferredKey != null && payload[preferredKey] is List) {
        return (payload[preferredKey] as List)
            .whereType<Map>()
            .map((e) => e.cast<String, dynamic>())
            .toList();
      }
      if (payload['data'] is List) {
        return (payload['data'] as List)
            .whereType<Map>()
            .map((e) => e.cast<String, dynamic>())
            .toList();
      }
      if (payload['emails'] is List) {
        return (payload['emails'] as List)
            .whereType<Map>()
            .map((e) => e.cast<String, dynamic>())
            .toList();
      }
      if (payload['accounts'] is List) {
        return (payload['accounts'] as List)
            .whereType<Map>()
            .map((e) => e.cast<String, dynamic>())
            .toList();
      }
    }
    return [];
  }

  dynamic _extractData(Map<String, dynamic>? response) {
    if (response == null) return null;
    final data = response['data'];
    if (data != null) return data;
    return response;
  }

  String? _asString(dynamic value) {
    if (value == null) return null;
    final text = value.toString();
    return text.isEmpty ? null : text;
  }

  int? _asInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    return int.tryParse(value.toString());
  }

  String _initials(String value) {
    final parts = value.trim().split(RegExp(r'\s+')).where((e) => e.isNotEmpty).toList();
    if (parts.isEmpty) return 'NA';
    if (parts.length == 1) {
      final text = parts.first;
      return text.length >= 2 ? text.substring(0, 2).toUpperCase() : text.toUpperCase();
    }
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  String _extractName(String fromAddress) {
    final bracketIndex = fromAddress.indexOf('<');
    if (bracketIndex > 0) {
      return fromAddress.substring(0, bracketIndex).trim().replaceAll('"', '');
    }
    if (fromAddress.contains('@')) {
      return fromAddress.split('@').first;
    }
    return fromAddress;
  }

  String _extractEmail(String fromAddress) {
    final match = RegExp(r'([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})', caseSensitive: false)
        .firstMatch(fromAddress);
    return match?.group(1) ?? fromAddress;
  }

  EmailPriority _mapPriority(String priorityRaw) {
    switch (priorityRaw) {
      case 'HIGH':
      case 'URGENT':
        return EmailPriority.high;
      case 'LOW':
        return EmailPriority.low;
      default:
        return EmailPriority.normal;
    }
  }

  EmailCategory _mapCategory(String statusRaw, String categoryRaw) {
    if (statusRaw == 'SENT') return EmailCategory.sent;
    if (statusRaw == 'DRAFTED') return EmailCategory.draft;
    if (statusRaw == 'FAILED') return EmailCategory.spam;

    final normalizedCategory = categoryRaw.toLowerCase();
    if (normalizedCategory.contains('social')) return EmailCategory.social;
    if (normalizedCategory.contains('promotion')) return EmailCategory.promotions;
    if (normalizedCategory.contains('forum')) return EmailCategory.forums;
    if (normalizedCategory.contains('spam')) return EmailCategory.spam;
    if (normalizedCategory.contains('trash')) return EmailCategory.trash;
    return EmailCategory.inbox;
  }
}

extension EmailCopyWith on Email {
  Email copyWith({
    String? id,
    String? sender,
    String? senderEmail,
    String? senderAvatar,
    List<String>? recipients,
    String? subject,
    String? body,
    String? preview,
    DateTime? date,
    bool? isRead,
    bool? isStarred,
    bool? isImportant,
    bool? hasAttachments,
    List<String>? attachments,
    EmailPriority? priority,
    EmailCategory? category,
    String? labelColor,
  }) {
    return Email(
      id: id ?? this.id,
      sender: sender ?? this.sender,
      senderEmail: senderEmail ?? this.senderEmail,
      senderAvatar: senderAvatar ?? this.senderAvatar,
      recipients: recipients ?? this.recipients,
      subject: subject ?? this.subject,
      body: body ?? this.body,
      preview: preview ?? this.preview,
      date: date ?? this.date,
      isRead: isRead ?? this.isRead,
      isStarred: isStarred ?? this.isStarred,
      isImportant: isImportant ?? this.isImportant,
      hasAttachments: hasAttachments ?? this.hasAttachments,
      attachments: attachments ?? this.attachments,
      priority: priority ?? this.priority,
      category: category ?? this.category,
      labelColor: labelColor ?? this.labelColor,
    );
  }
}

EmailCategory _mapLabelToCategory(EmailLabel label) {
  switch (label) {
    case EmailLabel.inbox:
      return EmailCategory.inbox;
    case EmailLabel.sent:
      return EmailCategory.sent;
    case EmailLabel.draft:
      return EmailCategory.draft;
    case EmailLabel.spam:
      return EmailCategory.spam;
    case EmailLabel.trash:
      return EmailCategory.trash;
    case EmailLabel.archive:
      return EmailCategory.inbox;
    case EmailLabel.starred:
      return EmailCategory.starred;
    case EmailLabel.important:
      return EmailCategory.important;
    case EmailLabel.social:
      return EmailCategory.social;
    case EmailLabel.promotions:
      return EmailCategory.promotions;
  }
}
