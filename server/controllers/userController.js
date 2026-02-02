const User = require('../models/User');

/**
 * Search users by name or email
 * GET /api/users?search=query
 * 
 * Searches for users matching the query in name or email fields.
 * Excludes the logged-in user from results.
 * Returns users without password field.
 */
const searchUsers = async (req, res) => {
  try {
    const { search } = req.query;

    console.log('Search request received:', { search, userId: req.user?._id });

    // Validate search query
    if (!search || typeof search !== 'string' || search.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Validate user is authenticated
    if (!req.user || !req.user._id) {
      console.error('User not authenticated in searchUsers');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Escape special regex characters to prevent errors
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create case-insensitive regex for search
    let searchRegex;
    try {
      searchRegex = new RegExp(escapedSearch, 'i');
    } catch (regexError) {
      console.error('Invalid regex pattern:', escapedSearch, regexError);
      return res.status(400).json({
        success: false,
        message: 'Invalid search query',
      });
    }

    // Search users by name or email, excluding current user
    const query = {
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ],
    };

    console.log('Search query:', JSON.stringify(query));

    const users = await User.find(query)
      .select('name email avatar isOnline')
      .limit(20)
      .sort({ name: 1 })
      .lean(); // Use lean() for better performance

    console.log(`Found ${users.length} users matching "${search}"`);

    res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Error searching users:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  searchUsers,
};

