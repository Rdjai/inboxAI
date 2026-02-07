import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:processmail_app/providers/email_provider.dart';
import 'package:processmail_app/widgets/email_card.dart';

class AllMailScreen extends StatelessWidget {
  const AllMailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final emailProvider = Provider.of<EmailProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'All Emails',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterDialog(context),
          ),
          IconButton(
            icon: const Icon(Icons.sort),
            onPressed: () => _showSortDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Statistics Bar
          Container(
            width: MediaQuery.of(context).size.width,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: const Color(0xFFF2F6FB),
            child: Wrap(
              spacing: 16,
              runSpacing: 8,
              alignment: WrapAlignment.spaceBetween,
              children: [
                _buildStatItem('Total', '${emailProvider.totalEmails}',
                    const Color(0xFF2F5D8A)),
                _buildStatItem('Unread', '${emailProvider.unreadCount}',
                    const Color(0xFFB54A4A)),
                _buildStatItem('Starred', '${emailProvider.starredCount}',
                    const Color(0xFFC28A2E)),
                _buildStatItem('Important', '${emailProvider.importantCount}',
                    const Color(0xFF9C6A2E)),
              ],
            ),
          ),

          // Email List
          Expanded(
            child: emailProvider.emails.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.inbox_outlined,
                          size: 64,
                          color: Colors.grey[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No emails found',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.only(top: 8),
                    itemCount: emailProvider.emails.length,
                    itemBuilder: (context, index) {
                      final email = emailProvider.emails[index];
                      return EmailCard(email: email);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  void _showFilterDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter Emails'),
        content: const Text('Filter options will be added here.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showSortDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sort Emails'),
        content: const Text('Sort options will be added here.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
