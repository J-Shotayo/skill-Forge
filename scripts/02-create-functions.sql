-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate course progress
CREATE OR REPLACE FUNCTION calculate_course_progress(enrollment_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  progress INTEGER;
BEGIN
  -- Get total lessons for the course
  SELECT COUNT(*) INTO total_lessons
  FROM lessons l
  JOIN enrollments e ON l.course_id = e.course_id
  WHERE e.id = enrollment_uuid;
  
  -- Get completed lessons
  SELECT COUNT(*) INTO completed_lessons
  FROM lesson_progress lp
  WHERE lp.enrollment_id = enrollment_uuid AND lp.completed = TRUE;
  
  -- Calculate progress percentage
  IF total_lessons > 0 THEN
    progress := ROUND((completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100);
  ELSE
    progress := 0;
  END IF;
  
  -- Update enrollment progress
  UPDATE enrollments 
  SET progress_percentage = progress,
      status = CASE WHEN progress = 100 THEN 'completed'::enrollment_status ELSE status END,
      completed_at = CASE WHEN progress = 100 AND completed_at IS NULL THEN NOW() ELSE completed_at END
  WHERE id = enrollment_uuid;
  
  RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- Function to award points and check badges
CREATE OR REPLACE FUNCTION award_points_and_badges(user_uuid UUID, points_to_add INTEGER)
RETURNS VOID AS $$
DECLARE
  new_total_points INTEGER;
  badge_record RECORD;
BEGIN
  -- Update user points
  UPDATE profiles 
  SET points = points + points_to_add 
  WHERE id = user_uuid
  RETURNING points INTO new_total_points;
  
  -- Check for new badges to award
  FOR badge_record IN 
    SELECT b.id, b.points_required
    FROM badges b
    WHERE b.points_required <= new_total_points
    AND NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = user_uuid AND ub.badge_id = b.id
    )
  LOOP
    INSERT INTO user_badges (user_id, badge_id) 
    VALUES (user_uuid, badge_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
