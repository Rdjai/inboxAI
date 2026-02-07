import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:processmail_app/providers/theme_provider.dart';
import 'package:provider/provider.dart';

class ComposeScreen extends StatefulWidget {
  final Map<String, dynamic>? arguments;

  const ComposeScreen({super.key, this.arguments});

  @override
  State<ComposeScreen> createState() => _ComposeScreenState();
}

class _ComposeScreenState extends State<ComposeScreen> {
  final _toController = TextEditingController();
  final _subjectController = TextEditingController();
  final _bodyController = TextEditingController();
  final _ccController = TextEditingController();
  final _bccController = TextEditingController();

  bool _isHTML = false;
  bool _showCc = false;
  bool _showBcc = false;
  List<String> _attachments = [];
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    // Pre-fill if arguments provided
    if (widget.arguments != null) {
      _toController.text = widget.arguments!['to'] ?? '';
      _subjectController.text = widget.arguments!['subject'] ?? '';
      _bodyController.text = widget.arguments!['body'] ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppThemeColors.backgroundDark
          : AppThemeColors.backgroundLight,
      appBar: _buildAppBar(context, isDark),
      body: Stack(
        children: [
          Column(
            children: [
              // Header with gradient
              Container(
                height: 120,
                decoration: BoxDecoration(
                  gradient: HomepageTheme.primaryGradient,
                ),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Compose New Email',
                        style: GoogleFonts.poppins(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Write and send your message',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Email Form
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      // From Field
                      _buildComposeField(
                        context,
                        Icons.person_outline,
                        'From',
                        'john.doe@processmail.com',
                        isReadOnly: true,
                      ),
                      const SizedBox(height: 16),

                      // To Field
                      _buildComposeField(
                        context,
                        Icons.email_outlined,
                        'To',
                        '',
                        controller: _toController,
                        hintText: 'recipient@example.com',
                      ),
                      const SizedBox(height: 12),

                      // CC & BCC Toggle
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _showCc = !_showCc;
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? AppThemeColors.surfaceDark
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _showCc
                                        ? AppThemeColors.primaryBlue
                                        : (isDark
                                            ? AppThemeColors.borderDark
                                            : AppThemeColors.borderLight),
                                    width: _showCc ? 2 : 1,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.copy_outlined,
                                      size: 18,
                                      color: _showCc
                                          ? AppThemeColors.primaryBlue
                                          : (isDark
                                              ? AppThemeColors.textSecondaryDark
                                              : AppThemeColors
                                                  .textSecondaryLight),
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      'Cc',
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: _showCc
                                            ? AppThemeColors.primaryBlue
                                            : (isDark
                                                ? AppThemeColors.textPrimaryDark
                                                : AppThemeColors
                                                    .textPrimaryLight),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _showBcc = !_showBcc;
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? AppThemeColors.surfaceDark
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _showBcc
                                        ? AppThemeColors.primaryBlue
                                        : (isDark
                                            ? AppThemeColors.borderDark
                                            : AppThemeColors.borderLight),
                                    width: _showBcc ? 2 : 1,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.visibility_off_outlined,
                                      size: 18,
                                      color: _showBcc
                                          ? AppThemeColors.primaryBlue
                                          : (isDark
                                              ? AppThemeColors.textSecondaryDark
                                              : AppThemeColors
                                                  .textSecondaryLight),
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      'Bcc',
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: _showBcc
                                            ? AppThemeColors.primaryBlue
                                            : (isDark
                                                ? AppThemeColors.textPrimaryDark
                                                : AppThemeColors
                                                    .textPrimaryLight),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                      // CC Field (Conditional)
                      if (_showCc) ...[
                        const SizedBox(height: 12),
                        _buildComposeField(
                          context,
                          Icons.copy_outlined,
                          'Cc',
                          '',
                          controller: _ccController,
                          hintText: 'cc@example.com',
                        ),
                      ],

                      // BCC Field (Conditional)
                      if (_showBcc) ...[
                        const SizedBox(height: 12),
                        _buildComposeField(
                          context,
                          Icons.visibility_off_outlined,
                          'Bcc',
                          '',
                          controller: _bccController,
                          hintText: 'bcc@example.com',
                        ),
                      ],

                      const SizedBox(height: 12),

                      // Subject
                      _buildComposeField(
                        context,
                        Icons.subject_outlined,
                        'Subject',
                        '',
                        controller: _subjectController,
                        hintText: 'What\'s this email about?',
                      ),
                      const SizedBox(height: 20),

                      // Attachments
                      if (_attachments.isNotEmpty)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.attach_file,
                                  size: 20,
                                  color: AppThemeColors.primaryBlue,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Attachments (${_attachments.length})',
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: isDark
                                        ? AppThemeColors.textPrimaryDark
                                        : AppThemeColors.textPrimaryLight,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 12,
                              runSpacing: 12,
                              children: _attachments.map((attachment) {
                                return Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? AppThemeColors.surfaceDark
                                        : Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isDark
                                          ? AppThemeColors.borderDark
                                          : AppThemeColors.borderLight,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.05),
                                        blurRadius: 6,
                                        spreadRadius: 1,
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 36,
                                        height: 36,
                                        decoration: BoxDecoration(
                                          color: AppThemeColors.primaryBlue
                                              .withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: Icon(
                                          Icons.insert_drive_file,
                                          size: 20,
                                          color: AppThemeColors.primaryBlue,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            attachment.split('/').last,
                                            style: GoogleFonts.poppins(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w500,
                                              color: isDark
                                                  ? AppThemeColors
                                                      .textPrimaryDark
                                                  : AppThemeColors
                                                      .textPrimaryLight,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'PDF Document',
                                            style: GoogleFonts.poppins(
                                              fontSize: 11,
                                              color: isDark
                                                  ? AppThemeColors
                                                      .textSecondaryDark
                                                  : AppThemeColors
                                                      .textSecondaryLight,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(width: 16),
                                      GestureDetector(
                                        onTap: () {
                                          setState(() {
                                            _attachments.remove(attachment);
                                          });
                                        },
                                        child: Icon(
                                          Icons.close,
                                          size: 18,
                                          color: isDark
                                              ? AppThemeColors.textSecondaryDark
                                              : AppThemeColors
                                                  .textSecondaryLight,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 20),
                          ],
                        ),

                      // Body with toolbar
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Message',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? AppThemeColors.textPrimaryDark
                                  : AppThemeColors.textPrimaryLight,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            decoration: BoxDecoration(
                              color: isDark
                                  ? AppThemeColors.surfaceDark
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark
                                    ? AppThemeColors.borderDark
                                    : AppThemeColors.borderLight,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 10,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                // Rich Text Toolbar
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? AppThemeColors.surfaceDark
                                        : Colors.white,
                                    borderRadius: const BorderRadius.vertical(
                                      top: Radius.circular(16),
                                    ),
                                    border: Border(
                                      bottom: BorderSide(
                                        color: isDark
                                            ? AppThemeColors.borderDark
                                            : AppThemeColors.borderLight,
                                      ),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      _buildFormatButton(Icons.format_bold),
                                      const SizedBox(width: 12),
                                      _buildFormatButton(Icons.format_italic),
                                      const SizedBox(width: 12),
                                      _buildFormatButton(
                                          Icons.format_underlined),
                                      const SizedBox(width: 12),
                                      _buildFormatButton(
                                          Icons.format_list_bulleted),
                                      const SizedBox(width: 12),
                                      _buildFormatButton(
                                          Icons.format_list_numbered),
                                      const Spacer(),
                                      Switch.adaptive(
                                        value: _isHTML,
                                        onChanged: (value) {
                                          setState(() {
                                            _isHTML = value;
                                          });
                                        },
                                        activeColor: AppThemeColors.primaryBlue,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'HTML',
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          color: isDark
                                              ? AppThemeColors.textSecondaryDark
                                              : AppThemeColors
                                                  .textSecondaryLight,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // Message Body
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: TextField(
                                    controller: _bodyController,
                                    maxLines: 12,
                                    minLines: 8,
                                    style: GoogleFonts.poppins(
                                      fontSize: 15,
                                      color: isDark
                                          ? AppThemeColors.textPrimaryDark
                                          : AppThemeColors.textPrimaryLight,
                                    ),
                                    decoration: InputDecoration(
                                      hintText: 'Write your message here...',
                                      hintStyle: GoogleFonts.poppins(
                                        fontSize: 15,
                                        color: isDark
                                            ? AppThemeColors.textSecondaryDark
                                            : AppThemeColors.textSecondaryLight,
                                      ),
                                      border: InputBorder.none,
                                      contentPadding: EdgeInsets.zero,
                                    ),
                                  ),
                                ),

                                // Footer with attachment button
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? AppThemeColors.surfaceDark
                                        : Colors.white,
                                    borderRadius: const BorderRadius.vertical(
                                      bottom: Radius.circular(16),
                                    ),
                                    border: Border(
                                      top: BorderSide(
                                        color: isDark
                                            ? AppThemeColors.borderDark
                                            : AppThemeColors.borderLight,
                                      ),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      _buildAttachmentButton(
                                          Icons.attach_file, 'Attach File'),
                                      const SizedBox(width: 12),
                                      _buildAttachmentButton(
                                          Icons.insert_photo, 'Insert Image'),
                                      const SizedBox(width: 12),
                                      _buildAttachmentButton(
                                          Icons.insert_link, 'Insert Link'),
                                      const Spacer(),
                                      _buildAttachmentButton(
                                          Icons.emoji_emotions_outlined,
                                          'Emoji'),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),

                      // Additional Options
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppThemeColors.surfaceDark
                              : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark
                                ? AppThemeColors.borderDark
                                : AppThemeColors.borderLight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.settings_outlined,
                                  size: 20,
                                  color: AppThemeColors.primaryBlue,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Additional Options',
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: isDark
                                        ? AppThemeColors.textPrimaryDark
                                        : AppThemeColors.textPrimaryLight,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildOptionItem(
                              Icons.done_all,
                              'Request read receipt',
                              'Get notified when recipient reads',
                              false,
                            ),
                            const SizedBox(height: 12),
                            _buildOptionItem(
                              Icons.lock_outline,
                              'Encrypt email',
                              'End-to-end encryption',
                              true,
                            ),
                            const SizedBox(height: 12),
                            _buildOptionItem(
                              Icons.schedule_outlined,
                              'Schedule send',
                              'Send at a specific time',
                              false,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Sending Overlay
          if (_isSending)
            Container(
              color: Colors.black.withOpacity(0.7),
              child: Center(
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    color: isDark ? AppThemeColors.surfaceDark : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppThemeColors.primaryBlue,
                        ),
                        strokeWidth: 3,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Sending Email',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppThemeColors.textPrimaryDark
                              : AppThemeColors.textPrimaryLight,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Please wait a moment...',
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: isDark
                              ? AppThemeColors.textSecondaryDark
                              : AppThemeColors.textSecondaryLight,
                        ),
                      ),
                      if (_attachments.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppThemeColors.primaryBlue.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '${_attachments.length} attachment${_attachments.length > 1 ? 's' : ''}',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: AppThemeColors.primaryBlue,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),

      // Bottom Send Button
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: isDark ? AppThemeColors.surfaceDark : Colors.white,
          border: Border(
            top: BorderSide(
              color: isDark
                  ? AppThemeColors.borderDark
                  : AppThemeColors.borderLight,
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _sendEmail,
                icon: const Icon(Icons.send_outlined, size: 20),
                label: const Text(
                  'Send Email',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppThemeColors.primaryBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
              ),
            ),
            const SizedBox(width: 12),
            SizedBox(
              width: 50,
              child: ElevatedButton(
                onPressed: _saveDraft,
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      isDark ? AppThemeColors.surfaceDark : Colors.white,
                  foregroundColor: isDark
                      ? AppThemeColors.textPrimaryDark
                      : AppThemeColors.textPrimaryLight,
                  padding: const EdgeInsets.all(12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: isDark
                          ? AppThemeColors.borderDark
                          : AppThemeColors.borderLight,
                    ),
                  ),
                ),
                child: const Icon(Icons.save_outlined, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context, bool isDark) {
    return AppBar(
      backgroundColor: Colors.transparent,
      foregroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.close, size: 20),
        ),
        onPressed: _isSending ? null : () => Navigator.pop(context),
      ),
      title: Text(
        'Compose',
        style: GoogleFonts.poppins(
          fontWeight: FontWeight.w600,
        ),
      ),
      centerTitle: true,
    );
  }

  Widget _buildComposeField(
    BuildContext context,
    IconData icon,
    String label,
    String value, {
    TextEditingController? controller,
    String hintText = '',
    bool isReadOnly = false,
  }) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? AppThemeColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color:
              isDark ? AppThemeColors.borderDark : AppThemeColors.borderLight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 6,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 20,
            color: isDark
                ? AppThemeColors.textSecondaryDark
                : AppThemeColors.textSecondaryLight,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: isDark
                        ? AppThemeColors.textSecondaryDark
                        : AppThemeColors.textSecondaryLight,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                TextField(
                  controller: controller,
                  readOnly: isReadOnly,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    color: isDark
                        ? AppThemeColors.textPrimaryDark
                        : AppThemeColors.textPrimaryLight,
                  ),
                  decoration: InputDecoration(
                    hintText: hintText,
                    hintStyle: GoogleFonts.poppins(
                      fontSize: 15,
                      color: isDark
                          ? AppThemeColors.textSecondaryDark
                          : AppThemeColors.textSecondaryLight,
                    ),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormatButton(IconData icon) {
    final themeProvider = Provider.of<ThemeProvider>(context, listen: false);
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: isDark ? AppThemeColors.surfaceDark : Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? AppThemeColors.borderDark : Colors.grey[200]!,
        ),
      ),
      child: Icon(
        icon,
        size: 18,
        color: isDark
            ? AppThemeColors.textSecondaryDark
            : AppThemeColors.textSecondaryLight,
      ),
    );
  }

  Widget _buildAttachmentButton(IconData icon, String label) {
    final themeProvider = Provider.of<ThemeProvider>(context, listen: false);
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return GestureDetector(
      onTap: () {
        if (label.contains('Attach')) {
          _attachFile();
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isDark ? AppThemeColors.surfaceDark : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color:
                isDark ? AppThemeColors.borderDark : AppThemeColors.borderLight,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isDark
                  ? AppThemeColors.textSecondaryDark
                  : AppThemeColors.textSecondaryLight,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: isDark
                    ? AppThemeColors.textSecondaryDark
                    : AppThemeColors.textSecondaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionItem(
      IconData icon, String title, String subtitle, bool value) {
    final themeProvider = Provider.of<ThemeProvider>(context, listen: false);
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: isDark
              ? AppThemeColors.textSecondaryDark
              : AppThemeColors.textSecondaryLight,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isDark
                      ? AppThemeColors.textPrimaryDark
                      : AppThemeColors.textPrimaryLight,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: isDark
                      ? AppThemeColors.textSecondaryDark
                      : AppThemeColors.textSecondaryLight,
                ),
              ),
            ],
          ),
        ),
        Switch.adaptive(
          value: value,
          onChanged: (_) {},
          activeColor: AppThemeColors.primaryBlue,
        ),
      ],
    );
  }

  void _sendEmail() {
    if (_toController.text.isEmpty || _bodyController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please fill in required fields'),
          backgroundColor: AppThemeColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      );
      return;
    }

    setState(() {
      _isSending = true;
    });

    // Simulate sending
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _isSending = false;
      });
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white, size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Email sent successfully!',
                  style: GoogleFonts.poppins(),
                ),
              ),
            ],
          ),
          backgroundColor: AppThemeColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          duration: const Duration(seconds: 3),
        ),
      );
    });
  }

  void _saveDraft() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.save, color: Colors.white, size: 20),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Draft saved successfully',
                style: GoogleFonts.poppins(),
              ),
            ),
          ],
        ),
        backgroundColor: AppThemeColors.accentGreen,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  void _attachFile() async {
    // Simulate file attachment
    setState(() {
      _attachments.add('/path/to/document${_attachments.length + 1}.pdf');
    });
  }

  @override
  void dispose() {
    _toController.dispose();
    _subjectController.dispose();
    _bodyController.dispose();
    _ccController.dispose();
    _bccController.dispose();
    super.dispose();
  }
}
