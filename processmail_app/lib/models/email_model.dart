class Email {
  final String id;
  final String sender;
  final String senderEmail;
  final String senderAvatar;
  final List<String> recipients;
  final String subject;
  final String body;
  final String preview;
  final DateTime date;
  final bool isRead;
  final bool isStarred;
  final bool isImportant;
  final bool hasAttachments;
  final List<String> attachments;
  final EmailPriority priority;
  final EmailCategory category;
  final String? labelColor;

  Email({
    required this.id,
    required this.sender,
    required this.senderEmail,
    required this.senderAvatar,
    this.recipients = const [],
    required this.subject,
    required this.body,
    required this.preview,
    required this.date,
    this.isRead = false,
    this.isStarred = false,
    this.isImportant = false,
    this.hasAttachments = false,
    this.attachments = const [],
    this.priority = EmailPriority.normal,
    this.category = EmailCategory.inbox,
    this.labelColor,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'sender': sender,
        'senderEmail': senderEmail,
        'senderAvatar': senderAvatar,
        'recipients': recipients,
        'subject': subject,
        'body': body,
        'preview': preview,
        'date': date.toIso8601String(),
        'isRead': isRead,
        'isStarred': isStarred,
        'isImportant': isImportant,
        'hasAttachments': hasAttachments,
        'attachments': attachments,
        'priority': priority.index,
        'category': category.index,
        'labelColor': labelColor,
      };

  factory Email.fromJson(Map<String, dynamic> json) => Email(
        id: json['id'],
        sender: json['sender'],
        senderEmail: json['senderEmail'],
        senderAvatar: json['senderAvatar'],
        recipients: List<String>.from(json['recipients'] ?? []),
        subject: json['subject'],
        body: json['body'],
        preview: json['preview'],
        date: DateTime.parse(json['date']),
        isRead: json['isRead'],
        isStarred: json['isStarred'],
        isImportant: json['isImportant'],
        hasAttachments: json['hasAttachments'],
        attachments: List<String>.from(json['attachments']),
        priority: EmailPriority.values[json['priority'] ?? 1],
        category: EmailCategory.values[json['category']],
        labelColor: json['labelColor'],
      );
}

enum EmailPriority { low, normal, high }

enum EmailLabel {
  inbox,
  sent,
  draft,
  spam,
  trash,
  archive,
  starred,
  important,
  social,
  promotions,
}

enum EmailCategory {
  inbox,
  starred,
  important,
  sent,
  draft,
  spam,
  trash,
  promotions,
  social,
  forums,
}

class TempMail {
  final String email;
  final String password;
  final DateTime expiresAt;
  final int messageCount;
  final String inboxId;

  TempMail({
    required this.email,
    required this.password,
    required this.expiresAt,
    required this.messageCount,
    required this.inboxId,
  });
}

class MailAccount {
  final String id;
  final String name;
  final String email;
  final String avatar;
  final String provider;
  final int unreadCount;

  MailAccount({
    required this.id,
    required this.name,
    required this.email,
    required this.avatar,
    required this.provider,
    required this.unreadCount,
  });
}
