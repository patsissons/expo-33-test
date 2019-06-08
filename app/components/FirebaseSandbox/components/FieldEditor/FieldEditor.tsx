import React, {useEffect, useState} from 'react';
import {Button, Input} from 'react-native-elements';

interface Props {
  id: string;
  name: string;
  onSave(id: string, value: string): Promise<any>;
  value: string;
}

export function FieldEditor({id, name, onSave, value: initialValue}: Props) {
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  async function handleSave() {
    try {
      setSaving(true);

      await onSave(id, value);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Input
      key={id}
      label={name}
      onChangeText={setValue}
      placeholder="Enter value"
      errorMessage={errorMessage}
      value={value}
      editable={!saving}
      rightIcon={
        <Button icon={{name: 'save', color: 'white'}} onPress={handleSave} />
      }
    />
  );
}
