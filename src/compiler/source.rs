#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Span {
    pub start: usize,
    pub end: usize,
    pub line: usize,
    pub column: usize,
}

impl Span {
    pub fn new(start: usize, end: usize, line: usize, column: usize) -> Self {
        Self { start, end, line, column }
    }

    pub fn join(&self, other: &Span) -> Span {
        let (line, column) = if self.start <= other.start {
            (self.line, self.column)
        } else {
            (other.line, other.column)
        };
        Span {
            start: self.start.min(other.start),
            end: self.end.max(other.end),
            line,
            column,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SourceFile {
    pub name: String,
    pub text: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SourceLine<'a> {
    pub number: usize,
    pub start: usize,
    pub end: usize,
    pub text: &'a str,
}

impl SourceFile {
    pub fn new(name: impl Into<String>, text: impl Into<String>) -> Self {
        Self { name: name.into(), text: text.into() }
    }

    /// Return one 1-based source line without its trailing newline or CRLF.
    /// Byte offsets remain offsets into the original source text.
    pub fn line(&self, number: usize) -> Option<SourceLine<'_>> {
        if number == 0 {
            return None;
        }

        let bytes = self.text.as_bytes();
        let mut current = 1usize;
        let mut start = 0usize;
        let mut i = 0usize;

        while i <= bytes.len() {
            if i == bytes.len() || bytes[i] == b'\n' {
                if current == number {
                    let mut end = i;
                    if end > start && bytes[end - 1] == b'\r' {
                        end -= 1;
                    }
                    return Some(SourceLine {
                        number,
                        start,
                        end,
                        text: &self.text[start..end],
                    });
                }
                current += 1;
                start = i.saturating_add(1);
            }
            i += 1;
        }

        None
    }

    /// Return the source line named by a span. Invalid line metadata never
    /// panics the diagnostic path; callers can fall back to the header only.
    pub fn line_for_span(&self, span: &Span) -> Option<SourceLine<'_>> {
        self.line(span.line)
    }

    /// Byte width of a span constrained to its starting source line. The
    /// renderer uses at least one marker even for zero-width EOF diagnostics.
    pub fn marker_width(&self, span: &Span) -> usize {
        let Some(line) = self.line_for_span(span) else { return 1; };
        let start = span.start.clamp(line.start, line.end);
        let end = span.end.clamp(start, line.end);
        end.saturating_sub(start).max(1)
    }
}
