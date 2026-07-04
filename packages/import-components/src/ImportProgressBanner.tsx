import { Box, LinearProgress, Typography } from "@mui/material";

type ImportProgressBannerProps = {
  progress: string | null;
  running?: boolean;
};

export function ImportProgressBanner({
  progress,
  running = true,
}: ImportProgressBannerProps) {
  if (!running || !progress) return null;

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {progress}
      </Typography>
      <LinearProgress />
    </Box>
  );
}
