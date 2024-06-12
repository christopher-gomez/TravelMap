import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";

const Input = styled(MuiInput)(({ value }) => ({
  width: `${Math.max(42, value.toString().length * 8 + 20)}px`, // Calculate width based on content
}));

export default function InputSlider({
  value,
  onValueChanged,
  label,
  icon,
  min,
  max,
}) {
  const [_value, setValue] = React.useState(value);

  React.useEffect(() => {
    setValue(value);
  }, [value]);

  React.useEffect(() => {
    onValueChanged(_value);
  }, [_value]);

  const handleSliderChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleInputChange = (event) => {
    setValue(event.target.value === "" ? 0 : Number(event.target.value));
  };

  const handleBlur = () => {
    if (_value < min) {
      setValue(min);
    } else if (_value > max) {
      setValue(max);
    }
  };

  return (
    <Box sx={{ width: "75%", m: 0 }}>
      <Typography
        id="input-slider"
        sx={{ textAlign: "center", fontFamily: "'Fredoka', sans-serif" }}
        variant="caption"
        gutterBottom
      >
        {label}
      </Typography>
      <Grid container spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
        {icon && <Grid item>{icon}</Grid>}
        <Grid item xs sx={{ pt: "0 !important" }}>
          <Slider
            value={typeof _value === "number" ? _value : 0}
            onChangeCommitted={handleSliderChange}
            aria-labelledby="input-slider"
            min={min}
            max={max}
            sx={{ p: 0 }}
          />
        </Grid>
        <Grid item sx={{ pt: "0 !important" }}>
          <Input
            value={_value}
            size="large"
            onChange={handleInputChange}
            onBlur={handleBlur}
            inputProps={{
              step: 10,
              min: min,
              max: max,
              type: "number",
              "aria-labelledby": "input-slider",
              value: _value, // Ensure this is passed correctly
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
