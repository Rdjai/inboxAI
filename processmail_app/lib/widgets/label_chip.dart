import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:processmail_app/models/email_model.dart';
import 'package:processmail_app/providers/email_provider.dart';

class LabelChip extends StatelessWidget {
  final EmailLabel label;
  final IconData icon;
  final int? count;

  const LabelChip({
    super.key,
    required this.label,
    required this.icon,
    this.count,
  });

  @override
  Widget build(BuildContext context) {
    final emailProvider = Provider.of<EmailProvider>(context);
    final isSelected = emailProvider.currentLabel == label;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: FilterChip(
        selected: isSelected,
        onSelected: (_) {
          emailProvider.setCurrentLabel(label);
        },
        avatar: Icon(icon, size: 18, color: isSelected ? Colors.white : null),
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_getLabelName(label)),
            if (count != null && count! > 0) ...[
              const SizedBox(width: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white : Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  count!.toString(),
                  style: TextStyle(
                    fontSize: 12,
                    color: isSelected
                        ? Theme.of(context).primaryColor
                        : Colors.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        backgroundColor: isSelected
            ? Theme.of(context).primaryColor
            : Colors.grey[200],
        selectedColor: Theme.of(context).primaryColor,
        labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black),
        checkmarkColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  String _getLabelName(EmailLabel label) {
    switch (label) {
      case EmailLabel.inbox:
        return 'Inbox';
      case EmailLabel.sent:
        return 'Sent';
      case EmailLabel.draft:
        return 'Draft';
      case EmailLabel.spam:
        return 'Spam';
      case EmailLabel.trash:
        return 'Trash';
      case EmailLabel.archive:
        return 'Archive';
      case EmailLabel.starred:
        return 'Starred';
      case EmailLabel.important:
        return 'Important';
      case EmailLabel.social:
        return 'Social';
      case EmailLabel.promotions:
        return 'Promotions';
    }
  }
}
