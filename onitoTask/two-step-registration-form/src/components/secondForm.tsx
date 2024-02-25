import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button, TextField } from '@mui/material';
import { Select, MenuItem, FormControl } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import MyDataTableComponent from './dataTables';
import { secondFormSchema } from '../yupSchema';
import { useDispatch } from 'react-redux';
import { updateUserExtraInfo } from '../redux/userSlice';

interface FormData {
  address: string;
  state: any;
  city: string;
  country: string;
  pinCode: number;
}

interface SecondFormProps {
  onSubmit: (data: any) => Promise<void>;
}

interface Country {
  name: {
    common: string;
    official: string;
  };
}

const SecondForm: React.FC<SecondFormProps> = (props) => {
  const [countries, setCountries] = React.useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = React.useState('');
  const [showTable, setShowTable] = React.useState(false);
  const methods = useForm<FormData>({
    resolver: yupResolver(secondFormSchema) as any,
  });

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const data = await response.json();
        setCountries(data);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;
  const dispatch = useDispatch();

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
    dispatch(updateUserExtraInfo(data));
    setShowTable(true);
  };

  return (
    <div className="container">
      <h4>Address Details</h4>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form">
          <div className="form-group">
            <div className="d-flex">
              <div className="label">Addess</div>
              <TextField
                placeholder="Enter Address"
                type="text"
                {...register('address')}
              />
            </div>
            {errors.address && (
              <div className="error">{errors.address.message}</div>
            )}
          </div>
          <div className="form-group">
            <div className="d-flex">
              <div className="label">State</div>
              <TextField
                placeholder="Enter State"
                type="text"
                {...register('state')}
              />
            </div>
            {errors.state && (
              <div className="error">{(errors.state as any).message}</div>
            )}
          </div>
          <div className="form-group">
            <div className="d-flex">
              <div className="label">City</div>
              <TextField
                placeholder="Enter City/Town/Village"
                type="text"
                {...register('city')}
              />
            </div>
            {errors.city && (
              <div className="error">{(errors.city as any).message}</div>
            )}
          </div>
        </div>
        <div className="form">
          <div className="form-group">
            <div className="d-flex">
              <div className="label">Country</div>
              <FormControl fullWidth>
                <Select
                  labelId="country-label"
                  id="country"
                  value={selectedCountry}
                  {...register('country')}
                  onChange={(event) => setSelectedCountry(event.target.value)}
                >
                  {countries.map((country) => (
                    <MenuItem key={'country'} value={country.name.common}>
                      {country.name.common}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>
          <div className="form-group">
            <div className="d-flex">
              <div className="label">Pin Code</div>
              <TextField
                placeholder="Enter Pind Code"
                {...register('pinCode')}
                type="number"
              />
            </div>
            {errors.pinCode && (
              <div className="error">{errors.pinCode.message}</div>
            )}
          </div>
        </div>

        <Button className="btn" type="submit">
          Submit
        </Button>
      </form>
      {showTable && <MyDataTableComponent />}
    </div>
  );
};

export default SecondForm;
