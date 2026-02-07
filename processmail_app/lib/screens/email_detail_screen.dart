import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:processmail_app/providers/email_provider.dart';
import 'package:processmail_app/models/email_model.dart';

class EmailDetailScreen extends StatelessWidget {
  final Email email;

  const EmailDetailScreen({super.key, required this.email});

  @override
  Widget build(BuildContext context) {
    final emailProvider = Provider.of<EmailProvider>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(
              email.isStarred ? Icons.star : Icons.star_border,
              color: email.isStarred ? Colors.amber : null,
            ),
            onPressed: () {
              emailProvider.toggleStar(email.id);
              Navigator.pop(context);
            },
          ),
          IconButton(
            icon: Icon(
              email.isImportant
                  ? Icons.label_important
                  : Icons.label_important_outline,
              color: email.isImportant ? Colors.red : null,
            ),
            onPressed: () {
              emailProvider.markAsImportant(email.id);
              Navigator.pop(context);
            },
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'reply',
                child: Row(
                  children: [
                    Icon(Icons.reply, size: 20),
                    SizedBox(width: 8),
                    Text('Reply'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'forward',
                child: Row(
                  children: [
                    Icon(Icons.forward, size: 20),
                    SizedBox(width: 8),
                    Text('Forward'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'archive',
                child: Row(
                  children: [
                    Icon(Icons.archive, size: 20),
                    SizedBox(width: 8),
                    Text('Archive'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, size: 20, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Delete', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
            onSelected: (value) {
              switch (value) {
                case 'delete':
                  emailProvider.deleteEmail(email.id);
                  Navigator.pop(context);
                  break;
                case 'reply':
                  Navigator.pushNamed(context, '/compose', arguments: {
                    'subject': 'Re: ${email.subject}',
                    'to': email.senderEmail,
                  });
                  break;
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  backgroundColor: _getAvatarColor(email.senderAvatar),
                  child: Text(
                    email.senderAvatar,
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        email.sender,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        email.senderEmail,
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _formatTime(email.date),
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                    Text(
                      _formatDate(email.date),
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Subject
            Text(
              email.subject,
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 24),

            // Badges
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (email.isImportant)
                  Chip(
                    backgroundColor: Colors.red[50],
                    label: Text(
                      'Important',
                      style: TextStyle(color: Colors.red[800]),
                    ),
                    avatar: const Icon(Icons.label_important, size: 16),
                  ),
                if (email.category != EmailCategory.inbox)
                  Chip(
                    backgroundColor: Colors.blue[50],
                    label: Text(
                      _getCategoryName(email.category),
                      style: TextStyle(color: Colors.blue[800]),
                    ),
                  ),
                if (email.hasAttachments)
                  Chip(
                    backgroundColor: Colors.green[50],
                    label: Text(
                      '${email.attachments.length} attachment${email.attachments.length > 1 ? 's' : ''}',
                      style: TextStyle(color: Colors.green[800]),
                    ),
                    avatar: const Icon(Icons.attach_file, size: 16),
                  ),
              ],
            ),

            const SizedBox(height: 32),

            // Body
            Text(
              email.body,
              style: GoogleFonts.poppins(
                fontSize: 16,
                height: 1.6,
                color: Colors.grey[800],
              ),
            ),

            const SizedBox(height: 32),

            // Attachments
            if (email.hasAttachments && email.attachments.isNotEmpty)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(),
                  const SizedBox(height: 16),
                  Text(
                    'Attachments',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...email.attachments.map((attachment) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const Icon(Icons.insert_drive_file),
                        title: Text(attachment),
                        trailing: IconButton(
                          icon: const Icon(Icons.download),
                          onPressed: () {},
                        ),
                      ),
                    );
                  }),
                ],
              ),

            const SizedBox(height: 60),
          ],
        ),
      ),

      // Action Buttons
      bottomSheet: Container(
        color: Colors.white,
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.pushNamed(context, '/compose', arguments: {
                    'subject': 'Re: ${email.subject}',
                    'to': email.senderEmail,
                  });
                },
                icon: const Icon(Icons.reply),
                label: const Text('Reply'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.pushNamed(context, '/compose', arguments: {
                    'subject': 'Fwd: ${email.subject}',
                  });
                },
                icon: const Icon(Icons.forward),
                label: const Text('Forward'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  emailProvider.deleteEmail(email.id);
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.delete_outline),
                label: const Text('Delete'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getAvatarColor(String initials) {
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.red,
      Colors.teal,
    ];
    final index = initials.codeUnits.fold(0, (a, b) => a + b) % colors.length;
    return colors[index];
  }

  String _getCategoryName(EmailCategory category) {
    switch (category) {
      case EmailCategory.inbox:
        return 'Inbox';
      case EmailCategory.starred:
        return 'Starred';
      case EmailCategory.important:
        return 'Important';
      case EmailCategory.sent:
        return 'Sent';
      case EmailCategory.draft:
        return 'Draft';
      case EmailCategory.spam:
        return 'Spam';
      case EmailCategory.trash:
        return 'Trash';
      case EmailCategory.promotions:
        return 'Promotions';
      case EmailCategory.social:
        return 'Social';
      case EmailCategory.forums:
        return 'Forums';
    }
  }

  String _formatTime(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 365) {
      return '${difference.inDays ~/ 365}y ago';
    } else if (difference.inDays > 30) {
      return '${difference.inDays ~/ 30}mo ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
