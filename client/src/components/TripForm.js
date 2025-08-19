import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Clock } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';

const TripForm = ({ trip, onSubmit, onCancel }) => {
  const [scheduleType, setScheduleType] = useState('custom');
  const [customCron, setCustomCron] = useState('');
  const [specificTime, setSpecificTime] = useState('08:00');
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();
  const isActive = watch('is_active', true);

  useEffect(() => {
    if (trip) {
      setValue('name', trip.name);
      setValue('origin_address', trip.origin_address);
      setValue('destination_address', trip.destination_address);
      setValue('is_active', trip.is_active);
      setCustomCron(trip.schedule_cron);
      
      // Determine schedule type
      if (trip.schedule_cron === '0 8 * * 1-5') setScheduleType('weekday-morning');
      else if (trip.schedule_cron === '0 17 * * 1-5') setScheduleType('weekday-evening');
      else if (trip.schedule_cron === '0 */2 * * *') setScheduleType('every-2-hours');
      else if (trip.schedule_cron === '0 */4 * * *') setScheduleType('every-4-hours');
      else if (trip.schedule_cron === '0 */30 * * *') setScheduleType('every-30-minutes');
      else if (trip.schedule_cron.match(/^0 \d+ \d+ \* \*$/)) {
        setScheduleType('specific-time');
        const hour = parseInt(trip.schedule_cron.split(' ')[1]);
        const minute = parseInt(trip.schedule_cron.split(' ')[0]);
        setSpecificTime(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
      else setScheduleType('custom');
    }
  }, [trip, setValue]);

  const getCronExpression = () => {
    switch (scheduleType) {
      case 'weekday-morning':
        return '0 8 * * 1-5'; // 8 AM on weekdays
      case 'weekday-evening':
        return '0 17 * * 1-5'; // 5 PM on weekdays
      case 'every-2-hours':
        return '0 */2 * * *'; // Every 2 hours
      case 'every-4-hours':
        return '0 */4 * * *'; // Every 4 hours
      case 'every-30-minutes':
        return '0 */30 * * *'; // Every 30 minutes
      case 'specific-time':
        const [hour, minute] = specificTime.split(':');
        return `${minute} ${hour} * * *`; // Specific time daily
      case 'custom':
        return customCron;
      default:
        return customCron;
    }
  };

  const handleFormSubmit = (data) => {
    const tripData = {
      ...data,
      schedule_cron: getCronExpression()
    };
    onSubmit(tripData);
  };

  const handleOriginChange = (value) => {
    setValue('origin_address', value);
  };

  const handleDestinationChange = (value) => {
    setValue('destination_address', value);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {trip ? 'Edit Trip' : 'Create New Trip'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Trip Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Trip name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Home to Work"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Origin Address with Custom Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origin Address
              </label>
              <AddressAutocomplete
                value={watch('origin_address')}
                onChange={handleOriginChange}
                placeholder="Enter origin address..."
                onAddressSelect={handleOriginChange}
              />
              <input
                type="hidden"
                {...register('origin_address', { required: 'Origin address is required' })}
              />
              {errors.origin_address && (
                <p className="text-red-500 text-sm mt-1">{errors.origin_address.message}</p>
              )}
            </div>

            {/* Destination Address with Custom Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Address
              </label>
              <AddressAutocomplete
                value={watch('destination_address')}
                onChange={handleDestinationChange}
                placeholder="Enter destination address..."
                onAddressSelect={handleDestinationChange}
              />
              <input
                type="hidden"
                {...register('destination_address', { required: 'Destination address is required' })}
              />
              {errors.destination_address && (
                <p className="text-red-500 text-sm mt-1">{errors.destination_address.message}</p>
              )}
            </div>

            {/* Schedule Configuration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Schedule
              </label>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="weekday-morning"
                    checked={scheduleType === 'weekday-morning'}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Weekday mornings (8 AM)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="weekday-evening"
                    checked={scheduleType === 'weekday-evening'}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Weekday evenings (5 PM)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="every-30-minutes"
                    checked={scheduleType === 'every-30-minutes'}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Every 30 minutes</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="every-2-hours"
                    checked={scheduleType === 'every-2-hours'}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Every 2 hours</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="every-4-hours"
                    checked={scheduleType === 'every-4-hours'}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Every 4 hours</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="specific-time"
                    checked={scheduleType === 'specific-time'}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">At specific time daily</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="custom"
                    checked={scheduleType === 'custom'}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Custom cron expression</span>
                </label>
              </div>

              {scheduleType === 'specific-time' && (
                <div className="mt-2">
                  <input
                    type="time"
                    value={specificTime}
                    onChange={(e) => setSpecificTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Check will run at this time every day
                  </p>
                </div>
              )}

              {scheduleType === 'custom' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="e.g., 0 8 * * 1-5 (8 AM weekdays)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: minute hour day month weekday
                  </p>
                </div>
              )}
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active (start tracking immediately)
                </span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                {trip ? 'Update Trip' : 'Create Trip'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TripForm;
