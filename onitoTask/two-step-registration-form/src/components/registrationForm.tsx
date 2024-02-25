import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import FirstForm from './firstForm';
import SecondForm from './secondForm';

const RegistrationForm: React.FC = () => {
  const [form, setForm] = useState('first');

  useEffect(() => {
    setForm('first');
  });
  const methods = useForm();

  const onSubmit = async (data: any) => {
    setForm(data);
  };
  console.log(form);

  return (
    <FormProvider {...methods}>
      {form === 'first' && <FirstForm onSubmit={onSubmit} />}
      {form === 'second' && <SecondForm onSubmit={onSubmit} />}
    </FormProvider>
  );
};

export default RegistrationForm;
