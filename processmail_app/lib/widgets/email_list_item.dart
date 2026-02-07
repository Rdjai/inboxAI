import 'package:flutter/material.dart';
import 'package:processmail_app/models/email_model.dart';

class EmailListItem extends StatelessWidget {
  final Email email;

  const EmailListItem({super.key, required this.email});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getPriorityColor(email.priority),
          child: Text(
            email.sender[0].toUpperCase(),
            style: const TextStyle(color: Colors.white),
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                email.sender,
                style: TextStyle(
                  fontWeight: email.isRead
                      ? FontWeight.normal
                      : FontWeight.bold,
                ),
              ),
            ),
            Text(
              _formatTime(email.date),
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              email.subject,
              style: TextStyle(
                fontWeight: email.isRead ? FontWeight.normal : FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              email.preview,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            if (email.isStarred)
              const Icon(Icons.star, color: Colors.amber, size: 16),
            if (email.hasAttachments) const Icon(Icons.attach_file, size: 16),
          ],
        ),
        onTap: () {
          Navigator.pushNamed(context, '/email', arguments: email);
        },
      ),
    );
  }

  Color _getPriorityColor(EmailPriority priority) {
    switch (priority) {
      case EmailPriority.high:
        return Colors.red;
      case EmailPriority.normal:
        return Colors.blue;
      case EmailPriority.low:
        return Colors.green;
    }
  }

  String _formatTime(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 365) {
      return '${difference.inDays ~/ 365}y';
    } else if (difference.inDays > 30) {
      return '${difference.inDays ~/ 30}mo';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'Just now';
    }
  }
}
