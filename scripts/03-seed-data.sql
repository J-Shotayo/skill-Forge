-- Insert sample categories
INSERT INTO categories (name, description, icon) VALUES
('Programming', 'Learn various programming languages and frameworks', '💻'),
('Design', 'UI/UX Design, Graphic Design, and Creative Skills', '🎨'),
('Business', 'Entrepreneurship, Marketing, and Business Skills', '💼'),
('Data Science', 'Analytics, Machine Learning, and Data Visualization', '📊'),
('Personal Development', 'Soft skills, productivity, and personal growth', '🚀');

-- Insert sample badges
INSERT INTO badges (name, description, icon, points_required) VALUES
('First Steps', 'Complete your first lesson', '🎯', 10),
('Quick Learner', 'Complete 5 lessons in a day', '⚡', 50),
('Course Crusher', 'Complete your first course', '🏆', 100),
('Knowledge Seeker', 'Enroll in 3 different courses', '📚', 150),
('Quiz Master', 'Pass 10 quizzes with 90%+ score', '🧠', 200),
('Dedicated Learner', 'Earn 500 points', '⭐', 500),
('Expert', 'Earn 1000 points', '👑', 1000);

-- Create RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (status = 'published' OR instructor_id = auth.uid());
CREATE POLICY "Instructors can manage own courses" ON courses FOR ALL USING (instructor_id = auth.uid());

-- Lessons policies
CREATE POLICY "Anyone can view lessons of published courses" ON lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND (courses.status = 'published' OR courses.instructor_id = auth.uid()))
);
CREATE POLICY "Instructors can manage lessons of own courses" ON lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.instructor_id = auth.uid())
);

-- Enrollments policies
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (learner_id = auth.uid());
CREATE POLICY "Users can create own enrollments" ON enrollments FOR INSERT WITH CHECK (learner_id = auth.uid());
CREATE POLICY "Instructors can view enrollments for their courses" ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = enrollments.course_id AND courses.instructor_id = auth.uid())
);

-- Lesson progress policies
CREATE POLICY "Users can manage own lesson progress" ON lesson_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM enrollments WHERE enrollments.id = lesson_progress.enrollment_id AND enrollments.learner_id = auth.uid())
);

-- Quiz attempts policies
CREATE POLICY "Users can manage own quiz attempts" ON quiz_attempts FOR ALL USING (
  EXISTS (SELECT 1 FROM enrollments WHERE enrollments.id = quiz_attempts.enrollment_id AND enrollments.learner_id = auth.uid())
);

-- Certificates policies
CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments WHERE enrollments.id = certificates.enrollment_id AND enrollments.learner_id = auth.uid())
);
