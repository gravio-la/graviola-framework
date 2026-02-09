import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";

import { Box, Button, Toolbar } from "@mui/material";
import { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import maplibregl from "maplibre-gl";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TerraDrawOnChangeContext } from "terra-draw/dist/common";
import type {
  FeatureId,
  GeoJSONStoreFeatures,
} from "terra-draw/dist/store/store";

import { MapLibreComponent } from "./MapLibreComponent";

interface TerradrawMapComponentProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  features?: GeoJSONStoreFeatures[];
  editFeatures?: GeoJSONStoreFeatures[];
  onFeaturesCreated?: (features: GeoJSONStoreFeatures[]) => void;
  onFeatureSelected?: (id: FeatureId) => void;
  onFeatureDeleted?: (
    ids: FeatureId[],
    type: string,
    context?: TerraDrawOnChangeContext,
  ) => void;
}

export const TerradrawMapComponent: React.FC<TerradrawMapComponentProps> = ({
  initialCenter,
  initialZoom = 3,
  features,
  editFeatures,
  onFeaturesCreated,
  onFeatureSelected,
  onFeatureDeleted,
}) => {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const draw = useMemo<MaplibreTerradrawControl | null>(() => {
    if (map) {
      const terraDraw = new MaplibreTerradrawControl({
        modes: [
          "render",
          "point",
          "linestring",
          "polygon",
          "rectangle",
          "circle",
          "freehand",
          "angled-rectangle",
          "sensor",
          "sector",
          "select",
          "delete-selection",
          "delete",
          "download",
        ],
        open: true,
      });
      map.addControl(terraDraw, "top-left");
      terraDraw.activate();
      return terraDraw;
    }
    return null;
  }, [map]);

  const handleMapCreated = useCallback(
    (_map: maplibregl.Map) => {
      // Wait for map to load before adding features
      _map.on("load", () => {
        setMap(_map);
        if (features) {
          //console.log('features', features);
          // Add features as a GeoJSON source
          _map.addSource("terradraw-features", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: features,
            },
          });

          // Add a layer for polygons
          _map.addLayer({
            id: "terradraw-polygons",
            type: "fill",
            source: "terradraw-features",
            paint: {
              "fill-color": "#888888",
              "fill-opacity": 0.4,
            },
            filter: ["==", "$type", "Polygon"],
          });

          // Add a layer for points
          _map.addLayer({
            id: "terradraw-points",
            type: "circle",
            source: "terradraw-features",
            paint: {
              "circle-radius": 6,
              "circle-color": "#B42222",
            },
            filter: ["==", "$type", "Point"],
          });

          // Add a layer for lines
          _map.addLayer({
            id: "terradraw-lines",
            type: "line",
            source: "terradraw-features",
            paint: {
              "line-color": "#888888",
              "line-width": 2,
            },
            filter: ["==", "$type", "LineString"],
          });
        }
      });
    },
    [features],
  );

  // Update features when they change
  useEffect(() => {
    if (map && features && typeof map.getSource === "function") {
      try {
        const source = map.getSource(
          "terradraw-features",
        ) as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: features,
          });
        }
      } catch (e) {
        console.warn("Error updating features:", e);
      }
    }
  }, [map, features]);

  useEffect(() => {
    if (draw) {
      if (editFeatures) {
        try {
          if (!draw.getTerraDrawInstance().enabled) {
            draw.getTerraDrawInstance().start();
          }
          const instance = draw.getTerraDrawInstance();
          instance.clear();
          instance.start();
          setTimeout(() => {
            editFeatures.forEach((feature) => {
              instance.addFeatures([feature]);
            });
          }, 1);
        } catch (e) {
          console.warn("Error adding features:", e);
        }
      }
    }
  }, [editFeatures]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (draw) {
        // Remove the control from the map
        draw.deactivate();
      }
      if (map && map.getStyle()) {
        try {
          // Remove layers and source
          if (map.getLayer("terradraw-polygons"))
            map.removeLayer("terradraw-polygons");
          if (map.getLayer("terradraw-points"))
            map.removeLayer("terradraw-points");
          if (map.getLayer("terradraw-lines"))
            map.removeLayer("terradraw-lines");
          if (map.getSource("terradraw-features"))
            map.removeSource("terradraw-features");
        } catch (e) {
          console.warn("Error cleaning up map layers:", e);
        }
      }
    };
  }, []);

  const handleCancel = () => {};

  const handleAccept = useCallback(() => {
    if (draw) {
      const features = draw.getFeatures().features;
      onFeaturesCreated?.(features);
      draw.getTerraDrawInstance().clear();
      draw.getTerraDrawInstance().start();
    }
  }, [draw, onFeaturesCreated]);

  return (
    <>
      <Box sx={{ marginBottom: 1 }}>
        <Toolbar
          variant="dense"
          sx={{
            justifyContent: "flex-end",
            gap: 1,
            backgroundColor: "#f5f5f5",
            borderRadius: 1,
          }}
        >
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleAccept}
          >
            Accept
          </Button>
        </Toolbar>
      </Box>
      <MapLibreComponent
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        onMapCreated={handleMapCreated}
      />
    </>
  );
};
