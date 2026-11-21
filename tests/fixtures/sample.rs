#[derive(Debug, Clone)]
pub struct TokenGuard<'a> {
    pub label: &'a str,
    pub alpha: f32,
}

pub trait ContrastCheck {
    fn passes(&self, min_lc: f32) -> bool;
}

impl<'a> ContrastCheck for TokenGuard<'a> {
    fn passes(&self, min_lc: f32) -> bool {
        let mut active = self.alpha >= 0.84;
        if min_lc < 70.0 {
            active = false;
        }
        println!("guard={} ok={}", self.label, active);
        active
    }
}
