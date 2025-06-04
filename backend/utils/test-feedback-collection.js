/**
 * Test Script for Feedback Collection Components
 * 
 * This script tests the Feedback Collection API endpoints
 * by sending sample requests and verifying the responses.
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Base URL for the API
const API_BASE_URL = 'http://localhost:4001';

// Generate a sample feedback submission
function generateSampleFeedback(scheduleId, userId) {
  return {
    scheduleId: scheduleId || `schedule_${Math.floor(Math.random() * 9000) + 1000}`,
    userId: userId || `user_${Math.floor(Math.random() * 900) + 100}`,
    rating: Math.floor(Math.random() * 5) + 1,
    comments: "This schedule has a good balance of home and away games, but could improve on the travel distances.",
    categoryRatings: {
      balance: Math.floor(Math.random() * 5) + 1,
      travel: Math.floor(Math.random() * 5) + 1,
      rest: Math.floor(Math.random() * 5) + 1,
      venue: Math.floor(Math.random() * 5) + 1,
      competitive: Math.floor(Math.random() * 5) + 1
    },
    metrics: {
      homeAwayBalance: Math.random(),
      travelDistance: Math.random(),
      restDays: Math.random(),
      venueDistribution: Math.random(),
      strengthOfSchedule: Math.random()
    },
    suggestions: [
      "Consider reducing back-to-back games for Team 3",
      "Try to cluster away games by region to reduce travel"
    ]
  };
}

// Generate a sample feedback template
function generateSampleTemplate() {
  return {
    name: "Basketball Schedule Feedback",
    description: "Template for collecting feedback on basketball schedules",
    questions: [
      {
        id: "overall_rating",
        text: "How would you rate this schedule overall?",
        type: "rating",
        required: true
      },
      {
        id: "home_away_balance",
        text: "How well balanced are the home and away games?",
        type: "rating",
        required: true
      },
      {
        id: "travel_efficiency",
        text: "How would you rate the travel efficiency?",
        type: "rating",
        required: true
      },
      {
        id: "rest_adequacy",
        text: "Do teams have adequate rest between games?",
        type: "rating",
        required: true
      },
      {
        id: "improvement_suggestions",
        text: "What suggestions do you have for improving this schedule?",
        type: "text",
        required: false
      }
    ],
    categories: ["balance", "travel", "rest"]
  };
}

/**
 * Test the Feedback Collection API endpoints
 */
async function testFeedbackCollectionApi() {
  try {
    console.log('Testing Feedback Collection API...');
    
    // Generate test IDs
    const scheduleId = `schedule_${Math.floor(Math.random() * 9000) + 1000}`;
    const userId = `user_${Math.floor(Math.random() * 900) + 100}`;
    
    // Test Category Listing
    console.log('\n1. Testing category listing...');
    await testCategoryListing();
    
    // Test Template Creation
    console.log('\n2. Testing template creation...');
    const templateId = await testTemplateCreation();
    
    // Test Template Listing
    console.log('\n3. Testing template listing...');
    await testTemplateListing();
    
    // Test Template Retrieval
    console.log('\n4. Testing template retrieval...');
    await testTemplateRetrieval(templateId);
    
    // Test Feedback Submission
    console.log('\n5. Testing feedback submission...');
    const feedbackId = await testFeedbackSubmission(scheduleId, userId);
    
    // Submit multiple feedbacks for analysis
    console.log('\n6. Submitting multiple feedbacks for analysis...');
    await testMultipleFeedbackSubmissions(scheduleId);
    
    // Test Feedback Listing
    console.log('\n7. Testing feedback listing...');
    await testFeedbackListing(scheduleId);
    
    // Test Feedback Retrieval
    console.log('\n8. Testing feedback retrieval...');
    await testFeedbackRetrieval(feedbackId);
    
    // Test Feedback Analysis
    console.log('\n9. Testing feedback analysis...');
    await testFeedbackAnalysis(scheduleId);
    
    // Test Feedback Deletion
    console.log('\n10. Testing feedback deletion...');
    await testFeedbackDeletion(feedbackId);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

/**
 * Test category listing
 */
async function testCategoryListing() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/feedback/categories`);
    
    console.log(`Found ${response.data.count} feedback categories:`);
    response.data.categories.forEach(category => {
      console.log(`- ${category.name}: ${category.description}`);
    });
    
    console.log('✅ Category listing test passed');
    return response.data.categories;
  } catch (error) {
    console.error('❌ Category listing test failed:', error.message);
    throw error;
  }
}

/**
 * Test template creation
 */
async function testTemplateCreation() {
  try {
    const template = generateSampleTemplate();
    
    const response = await axios.post(`${API_BASE_URL}/api/feedback/template`, template);
    
    console.log(`Created template: ${response.data.templateId}`);
    console.log('Message:', response.data.message);
    
    console.log('✅ Template creation test passed');
    return response.data.templateId;
  } catch (error) {
    console.error('❌ Template creation test failed:', error.message);
    throw error;
  }
}

/**
 * Test template listing
 */
async function testTemplateListing() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/feedback/template`);
    
    console.log(`Found ${response.data.count} feedback templates`);
    
    console.log('✅ Template listing test passed');
    return response.data.templates;
  } catch (error) {
    console.error('❌ Template listing test failed:', error.message);
    throw error;
  }
}

/**
 * Test template retrieval
 */
async function testTemplateRetrieval(templateId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/feedback/template/${templateId}`);
    
    console.log(`Retrieved template: ${response.data.template.name}`);
    console.log(`Template has ${response.data.template.questions.length} questions`);
    
    console.log('✅ Template retrieval test passed');
    return response.data.template;
  } catch (error) {
    console.error('❌ Template retrieval test failed:', error.message);
    throw error;
  }
}

/**
 * Test feedback submission
 */
async function testFeedbackSubmission(scheduleId, userId) {
  try {
    const feedback = generateSampleFeedback(scheduleId, userId);
    
    const response = await axios.post(`${API_BASE_URL}/api/feedback/submit`, feedback);
    
    console.log(`Submitted feedback: ${response.data.feedbackId}`);
    console.log('Message:', response.data.message);
    
    console.log('✅ Feedback submission test passed');
    return response.data.feedbackId;
  } catch (error) {
    console.error('❌ Feedback submission test failed:', error.message);
    throw error;
  }
}

/**
 * Test multiple feedback submissions
 */
async function testMultipleFeedbackSubmissions(scheduleId) {
  try {
    // Submit 4 more feedback entries for the same schedule
    for (let i = 0; i < 4; i++) {
      const userId = `user_${Math.floor(Math.random() * 900) + 100}`;
      const feedback = generateSampleFeedback(scheduleId, userId);
      
      await axios.post(`${API_BASE_URL}/api/feedback/submit`, feedback);
      console.log(`Submitted additional feedback ${i+1} for analysis`);
    }
    
    console.log('✅ Multiple feedback submissions completed');
    return true;
  } catch (error) {
    console.error('❌ Multiple feedback submissions failed:', error.message);
    throw error;
  }
}

/**
 * Test feedback listing
 */
async function testFeedbackListing(scheduleId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/feedback/list?scheduleId=${scheduleId}`);
    
    console.log(`Found ${response.data.count} feedbacks for schedule ${scheduleId}`);
    
    console.log('✅ Feedback listing test passed');
    return response.data.feedback;
  } catch (error) {
    console.error('❌ Feedback listing test failed:', error.message);
    throw error;
  }
}

/**
 * Test feedback retrieval
 */
async function testFeedbackRetrieval(feedbackId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/feedback/${feedbackId}`);
    
    console.log(`Retrieved feedback: ${response.data.feedback.id}`);
    console.log(`Rating: ${response.data.feedback.rating}`);
    
    console.log('✅ Feedback retrieval test passed');
    return response.data.feedback;
  } catch (error) {
    console.error('❌ Feedback retrieval test failed:', error.message);
    throw error;
  }
}

/**
 * Test feedback analysis
 */
async function testFeedbackAnalysis(scheduleId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/feedback/analysis?scheduleId=${scheduleId}`);
    
    console.log(`Analyzed ${response.data.feedbackCount} feedbacks for schedule ${scheduleId}`);
    console.log(`Average rating: ${response.data.averageRating}`);
    
    // Log category ratings
    const categoryRatings = response.data.categoryRatings;
    for (const category in categoryRatings) {
      console.log(`- ${categoryRatings[category].name}: ${categoryRatings[category].averageRating.toFixed(2)}`);
    }
    
    console.log('✅ Feedback analysis test passed');
    return response.data;
  } catch (error) {
    console.error('❌ Feedback analysis test failed:', error.message);
    throw error;
  }
}

/**
 * Test feedback deletion
 */
async function testFeedbackDeletion(feedbackId) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/feedback/${feedbackId}`);
    
    console.log(`Deleted feedback: ${response.data.deletedFeedbackId}`);
    console.log('Message:', response.data.message);
    
    console.log('✅ Feedback deletion test passed');
    return true;
  } catch (error) {
    console.error('❌ Feedback deletion test failed:', error.message);
    throw error;
  }
}

// Run the tests
testFeedbackCollectionApi().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});