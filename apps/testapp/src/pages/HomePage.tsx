import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { SchemaConfig, SchemaIcon } from "../schemaTypes";

function renderSchemaIcon(icon: SchemaIcon | undefined, size = "2rem") {
  if (!icon) return null;
  if (typeof icon === "string") {
    return (
      <Box component="span" sx={{ fontSize: size, lineHeight: 1 }}>
        {icon}
      </Box>
    );
  }
  const Cmp = icon;
  return <Cmp stroke={1.5} size={size} />;
}

type HomePageProps = {
  allSchemas: SchemaConfig[];
};

export function HomePage({ allSchemas }: HomePageProps) {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Graviola testapp
      </Typography>
      <Typography color="text.secondary" paragraph>
        Choose a schema — each uses its own in-browser Oxigraph store and local
        persistence key.
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
        }}
      >
        {allSchemas.map((s) => (
          <Box key={s.schemaName}>
            <Card
              sx={{
                height: "100%",
                borderTop: 4,
                borderColor: s.color ?? "primary.main",
              }}
            >
              <CardActionArea
                onClick={() => navigate(`/${s.schemaName}`)}
                sx={{ height: "100%", alignItems: "stretch" }}
              >
                {s.cardImage ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={s.cardImage}
                    alt=""
                    sx={{ objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 140,
                      bgcolor: s.color ?? "primary.light",
                      opacity: 0.35,
                    }}
                  />
                )}
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    {renderSchemaIcon(s.icon)}
                    <Typography variant="h6" component="div">
                      {s.label}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {s.description}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    <Chip size="small" label={`v${s.version}`} />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={s.storageKey}
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
