import 'package:flutter/material.dart';
import 'package:processmail_app/models/email_model.dart';

class EmailProvider extends ChangeNotifier {
  List<Email> _emails = [];
  List<TempMail> _tempMails = [];
  List<MailAccount> _accounts = [];
  EmailCategory _currentCategory = EmailCategory.inbox;
  EmailLabel _currentLabel = EmailLabel.inbox;
  String _searchQuery = '';
  bool _isLoading = false;

  // Getters
  List<Email> get emails => _filteredEmails;
  List<TempMail> get tempMails => _tempMails;
  List<MailAccount> get accounts => _accounts;
  EmailCategory get currentCategory => _currentCategory;
  EmailLabel get currentLabel => _currentLabel;
  bool get isLoading => _isLoading;

  // Statistics
  int get totalEmails => _emails.length;
  int get unreadCount => _emails.where((e) => !e.isRead).length;
  int get starredCount => _emails.where((e) => e.isStarred).length;
  int get importantCount => _emails.where((e) => e.isImportant).length;

  // Filtered emails based on category and search
  List<Email> get _filteredEmails {
    if (_searchQuery.isEmpty) {
      return _emails
          .where((email) => email.category == _currentCategory)
          .toList();
    } else {
      return _emails
          .where((email) => email.category == _currentCategory)
          .where((email) =>
              email.subject
                  .toLowerCase()
                  .contains(_searchQuery.toLowerCase()) ||
              email.sender.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              email.body.toLowerCase().contains(_searchQuery.toLowerCase()))
          .toList();
    }
  }

  EmailProvider() {
    _initializeDummyData();
  }

// Add to EmailProvider class
  void logout() {
    _emails.clear();
    _tempMails.clear();
    _accounts.clear();
    _initializeDummyData(); // Reinitialize with dummy data
    notifyListeners();
  }

  void _initializeDummyData() {
    // Dummy Email Accounts
    _accounts = [
      MailAccount(
        id: '1',
        name: 'John Doe',
        email: 'john.doe@processmail.com',
        avatar: 'JD',
        provider: 'ProcessMail',
        unreadCount: 5,
      ),
      MailAccount(
        id: '2',
        name: 'Sarah Smith',
        email: 'sarah.smith@gmail.com',
        avatar: 'SS',
        provider: 'Gmail',
        unreadCount: 12,
      ),
      MailAccount(
        id: '3',
        name: 'Alex Johnson',
        email: 'alex.j@outlook.com',
        avatar: 'AJ',
        provider: 'Outlook',
        unreadCount: 3,
      ),
    ];

    // Dummy Emails
    _emails = [
      Email(
        id: '1',
        sender: 'GitHub',
        senderEmail: 'notifications@github.com',
        senderAvatar: 'GH',
        subject: 'Repository starred your project',
        body:
            'Your repository "flutter-processmail" has been starred by user "techguru".',
        preview: 'Your repository has received a new star...',
        date: DateTime.now().subtract(const Duration(minutes: 30)),
        category: EmailCategory.inbox,
        isImportant: true,
      ),
      Email(
        id: '2',
        sender: 'LinkedIn',
        senderEmail: 'news@linkedin.com',
        senderAvatar: 'LI',
        subject: 'New connection requests',
        body:
            'You have 5 new connection requests from professionals in your industry.',
        preview: 'Expand your professional network...',
        date: DateTime.now().subtract(const Duration(hours: 2)),
        category: EmailCategory.social,
        isRead: true,
      ),
      Email(
        id: '3',
        sender: 'Amazon',
        senderEmail: 'deals@amazon.com',
        senderAvatar: 'AZ',
        subject: 'Prime Day Exclusive Deals',
        body:
            'Exclusive Prime Day deals on electronics, home appliances, and more.',
        preview: 'Don\'t miss out on these exclusive deals...',
        date: DateTime.now().subtract(const Duration(hours: 5)),
        category: EmailCategory.promotions,
        hasAttachments: true,
        attachments: ['catalog.pdf'],
      ),
      Email(
        id: '4',
        sender: 'Mark Zuckerberg',
        senderEmail: 'mark@meta.com',
        senderAvatar: 'MZ',
        subject: 'Interview Opportunity at Meta',
        body:
            'We were impressed by your profile and would like to invite you for an interview.',
        preview: 'Great opportunity to join our team...',
        date: DateTime.now().subtract(const Duration(days: 1)),
        category: EmailCategory.inbox,
        isStarred: true,
        isImportant: true,
      ),
      Email(
        id: '5',
        sender: 'Flutter Team',
        senderEmail: 'flutter@google.com',
        senderAvatar: 'FT',
        subject: 'Flutter 3.10 Released',
        body:
            'New features include enhanced web support, improved performance, and new widgets.',
        preview: 'Exciting updates in the latest Flutter release...',
        date: DateTime.now().subtract(const Duration(days: 2)),
        category: EmailCategory.forums,
        isRead: true,
      ),
      Email(
        id: '6',
        sender: 'Netflix',
        senderEmail: 'updates@netflix.com',
        senderAvatar: 'NF',
        subject: 'New Shows Added This Month',
        body:
            'Check out the latest movies and shows added to Netflix this month.',
        preview: 'Your next binge-watch is waiting...',
        date: DateTime.now().subtract(const Duration(days: 3)),
        category: EmailCategory.promotions,
      ),
      Email(
        id: '7',
        sender: 'Google',
        senderEmail: 'security@google.com',
        senderAvatar: 'GG',
        subject: 'Security Alert - New Device Login',
        body:
            'A new device logged into your Google account from San Francisco, CA.',
        preview: 'Review your account security...',
        date: DateTime.now().subtract(const Duration(days: 4)),
        category: EmailCategory.inbox,
        isImportant: true,
      ),
      Email(
        id: '8',
        sender: 'Medium',
        senderEmail: 'digest@medium.com',
        senderAvatar: 'MD',
        subject: 'Top Stories for You This Week',
        body:
            'Based on your reading history, here are the top stories we think you\'ll love.',
        preview: 'Curated stories just for you...',
        date: DateTime.now().subtract(const Duration(days: 5)),
        category: EmailCategory.promotions,
        isRead: true,
      ),
    ];

    // Dummy Temp Mails
    _tempMails = [
      TempMail(
        email: 'temp123@processmail.temp',
        password: 'tempPass123',
        expiresAt: DateTime.now().add(const Duration(hours: 24)),
        messageCount: 3,
        inboxId: 'temp123',
      ),
      TempMail(
        email: 'anon456@securemail.temp',
        password: 'secure456',
        expiresAt: DateTime.now().add(const Duration(hours: 12)),
        messageCount: 0,
        inboxId: 'anon456',
      ),
    ];

    notifyListeners();
  }

  // Methods
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
      _emails[index] = _emails[index].copyWith(
        isStarred: !_emails[index].isStarred,
      );
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
    _isLoading = true;
    notifyListeners();

    await Future.delayed(const Duration(seconds: 2));

    // Simulate new emails
    if (_emails.length < 15) {
      _emails.insert(
          0,
          Email(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            sender: 'New Sender',
            senderEmail: 'new@sender.com',
            senderAvatar: 'NS',
            subject: 'New Email Received',
            body: 'This is a new email added on refresh.',
            preview: 'New email preview...',
            date: DateTime.now(),
            category: EmailCategory.inbox,
          ));
    }

    _isLoading = false;
    notifyListeners();
  }
}

// Extension for Email copyWith
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
