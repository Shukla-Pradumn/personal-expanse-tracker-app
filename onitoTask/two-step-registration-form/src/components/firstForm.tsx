import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button, TextField } from '@mui/material';
import { Select, MenuItem, FormControl } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import { firstFormSchema } from '../yupSchema';
import { useDispatch } from 'react-redux';
import { updateUserData } from '../redux/userSlice';

interface FormData {
  firstName: string;
  dob: any;
  mobile: string;
  sex: string;
  id: any;
  idType: any;
}

interface FirstFormProps {
  onSubmit: (data: any) => Promise<void>;
}

const FirstForm: React.FC<FirstFormProps> = (props) => {
  const methods = useForm<FormData>({
    resolver: yupResolver(firstFormSchema) as any,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
    console.log('data', data);
    console.log('methods', methods.handleSubmit);
    console.log('errors', errors);
    dispatch(updateUserData(data));
    navigate('/secondForm');
  };

  return (
    <div className="container">
      <h4>Personal Details</h4>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form">
          <div className="form-group">
            <div className="d-flex">
              <div className="label">Name*</div>
              <TextField
                placeholder="Enter name"
                type="text"
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <div className="error">{errors.firstName.message}</div>
            )}
          </div>
          <div className="form-group">
            <div className="d-flex">
              <div className="label">Date of Birth or Age*</div>
              <TextField
                placeholder="DD/MM/YYYY or Age in years"
                type="text"
                {...register('dob')}
              />
            </div>
            {errors.dob && (
              <div className="error">{(errors.dob as any).message}</div>
            )}
          </div>
          <div className="form-group">
            <FormControl>
              <Select
                labelId="sex-label"
                {...register('sex')}
                defaultValue=""
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Enter sex
                </MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="others">Others</MenuItem>
              </Select>
            </FormControl>
            {errors.sex && <div className="error">{errors.sex.message}</div>}
          </div>
        </div>
        <div className="form">
          <div className="form-group">
            <div className="d-flex">
              <div className="label">Mobile</div>
              <TextField
                placeholder="Enter mobile"
                {...register('mobile')}
                type="number"
              />
            </div>
            {errors.mobile && (
              <div className="error">{errors.mobile.message}</div>
            )}
          </div>
          <div style={{ display: 'flex' }}>
            <div className="form-group mr-10">
              <div className="d-flex">
                <div className="label">Government Issued ID</div>
                <FormControl>
                  <Select
                    labelId="idType"
                    {...register('idType')}
                    defaultValue=""
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      ID Type
                    </MenuItem>
                    <MenuItem value="aadhar">Aadhar</MenuItem>
                    <MenuItem value="pan">PAN</MenuItem>
                  </Select>
                </FormControl>
              </div>
              {errors.idType && (
                <div className="error">{(errors.idType as any).message}</div>
              )}
            </div>
            <div className="form-group">
              <TextField
                placeholder="Enter government ID"
                {...register('id')}
              />
              {errors.id && (
                <div className="error">{(errors.id as any).message}</div>
              )}
            </div>
          </div>
        </div>

        <Button className="btn" type="submit">
          Next
        </Button>
      </form>
    </div>
  );
};

export default FirstForm;
