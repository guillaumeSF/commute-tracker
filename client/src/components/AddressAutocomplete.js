import React, { useState, useEffect, useRef } from 'react';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  onAddressSelect 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (input) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      // Use the new Places API with fetch
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&types=address`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      
      if (data.status === 'OK') {
        setSuggestions(data.predictions);
      } else {
        console.warn('Places API error:', data.status);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    
    if (newValue.length >= 3) {
      fetchSuggestions(newValue);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    try {
      // Get place details for the selected suggestion
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&fields=formatted_address`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      
      if (data.status === 'OK') {
        const formattedAddress = data.result.formatted_address;
        setInputValue(formattedAddress);
        onChange(formattedAddress);
        if (onAddressSelect) {
          onAddressSelect(formattedAddress);
        }
      } else {
        // Fallback to description if details fail
        setInputValue(suggestion.description);
        onChange(suggestion.description);
        if (onAddressSelect) {
          onAddressSelect(suggestion.description);
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Fallback to description
      setInputValue(suggestion.description);
      onChange(suggestion.description);
      if (onAddressSelect) {
        onAddressSelect(suggestion.description);
      }
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id || index}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
