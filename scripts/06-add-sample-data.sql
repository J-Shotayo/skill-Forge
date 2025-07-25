-- Insert sample instructor profiles (these will be created manually since we can't create auth users via SQL)
-- You'll need to sign up as instructors first, then we can update their profiles

-- Insert more categories if they don't exist
INSERT INTO categories (name, description, icon) VALUES
('Web Development', 'HTML, CSS, JavaScript, React, and more', '🌐'),
('Mobile Development', 'iOS, Android, React Native development', '📱'),
('DevOps', 'Docker, Kubernetes, CI/CD, Cloud platforms', '⚙️'),
('Cybersecurity', 'Network security, ethical hacking, compliance', '🔒'),
('AI & Machine Learning', 'Neural networks, deep learning, AI applications', '🤖')
ON CONFLICT (name) DO NOTHING;

-- Insert sample courses (we'll create these with placeholder instructor IDs)
-- Note: You'll need to update instructor_id with real user IDs after creating instructor accounts

-- Get category IDs for reference
DO $$
DECLARE
    web_dev_id UUID;
    programming_id UUID;
    design_id UUID;
    business_id UUID;
    data_science_id UUID;
BEGIN
    SELECT id INTO web_dev_id FROM categories WHERE name = 'Web Development';
    SELECT id INTO programming_id FROM categories WHERE name = 'Programming';
    SELECT id INTO design_id FROM categories WHERE name = 'Design';
    SELECT id INTO business_id FROM categories WHERE name = 'Business';
    SELECT id INTO data_science_id FROM categories WHERE name = 'Data Science';

    -- Insert sample courses with placeholder instructor_id
    -- These will need to be updated with real instructor IDs
    INSERT INTO courses (id, instructor_id, category_id, title, description, price, status, duration_hours, level, is_featured) VALUES
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000', -- Placeholder - update with real instructor ID
        web_dev_id,
        'Complete React Development Course',
        'Learn React from basics to advanced concepts including hooks, context, and state management. Build real-world projects and deploy them to production.',
        99.99,
        'published',
        40,
        'intermediate',
        true
    ),
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000', -- Placeholder - update with real instructor ID
        programming_id,
        'Python for Beginners',
        'Start your programming journey with Python. Learn syntax, data structures, functions, and object-oriented programming through hands-on exercises.',
        79.99,
        'published',
        25,
        'beginner',
        true
    ),
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000', -- Placeholder - update with real instructor ID
        design_id,
        'UI/UX Design Fundamentals',
        'Master the principles of user interface and user experience design. Learn design thinking, prototyping, and user research methodologies.',
        129.99,
        'published',
        35,
        'beginner',
        true
    ),
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000', -- Placeholder - update with real instructor ID
        data_science_id,
        'Data Analysis with Python',
        'Analyze data using Python, pandas, numpy, and matplotlib. Learn statistical analysis, data visualization, and machine learning basics.',
        149.99,
        'published',
        45,
        'intermediate',
        false
    ),
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000', -- Placeholder - update with real instructor ID
        business_id,
        'Digital Marketing Mastery',
        'Complete guide to digital marketing including SEO, social media marketing, email marketing, and analytics. Grow your online presence.',
        89.99,
        'published',
        30,
        'beginner',
        true
    ),
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000', -- Placeholder - update with real instructor ID
        web_dev_id,
        'Advanced JavaScript Concepts',
        'Deep dive into JavaScript including closures, prototypes, async programming, and modern ES6+ features. Perfect for intermediate developers.',
        119.99,
        'draft',
        35,
        'advanced',
        false
    )
    ON CONFLICT (id) DO NOTHING;

END $$;

-- Function to create sample instructor profile and update courses
CREATE OR REPLACE FUNCTION create_sample_instructor(
    instructor_email TEXT,
    instructor_name TEXT,
    instructor_bio TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    instructor_id UUID;
BEGIN
    -- This function should be called after creating an instructor account
    -- It will update the instructor's profile and assign them to sample courses
    
    SELECT id INTO instructor_id FROM profiles WHERE email = instructor_email;
    
    IF instructor_id IS NOT NULL THEN
        -- Update instructor profile
        UPDATE profiles 
        SET 
            full_name = instructor_name,
            bio = instructor_bio,
            role = 'instructor'
        WHERE id = instructor_id;
        
        -- Assign some courses to this instructor
        UPDATE courses 
        SET instructor_id = instructor_id 
        WHERE instructor_id = '00000000-0000-0000-0000-000000000000'
        AND id IN (
            SELECT id FROM courses 
            WHERE instructor_id = '00000000-0000-0000-0000-000000000000' 
            LIMIT 2
        );
        
        RETURN instructor_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add more badges for better gamification
INSERT INTO badges (name, description, icon, points_required) VALUES
('Early Bird', 'Complete a lesson before 9 AM', '🌅', 25),
('Night Owl', 'Complete a lesson after 10 PM', '🦉', 25),
('Streak Master', 'Maintain a 7-day learning streak', '🔥', 75),
('Social Learner', 'Complete 3 courses with discussion participation', '💬', 150),
('Speed Learner', 'Complete a course in under 24 hours', '⚡', 100),
('Perfectionist', 'Score 100% on 5 different quizzes', '💯', 125),
('Explorer', 'Complete courses in 3 different categories', '🗺️', 200),
('Mentor', 'Help 10 other learners in discussions', '🤝', 300)
ON CONFLICT (name) DO NOTHING;
