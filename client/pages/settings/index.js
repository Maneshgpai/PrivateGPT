import Header from "../components/Header";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Layout from "../components/Layout";
import Hero from "../components/Hero";
import styles from './Settings.module.css'; // Make sure to create a CSS module file with your styles
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

export default function Home() {
  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(0),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }));

  return (
    <>
      <SignedIn>
        <div >
          <Layout>
            <div className={`${styles.settingsContainer} `}>
              <h1 className="text-center py-3 font-bold text-xl text-gray-600">Settings</h1>

              <div className="">
              <Grid container >
                <Grid item sm={4} marginTop={5}>
                  <Item>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div" align="left">
                          Usage
                        </Typography>
                        <Typography variant="caption" component="div" align="left">
                          Tracking of usage and costing for every user, displaying in Settings, limiting use after crossing threshold/not paying bill.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Item>
                </Grid>
                <Grid item sm={4} marginLeft={5} marginTop={5}>
                  <Item>
                    <Card >
                      <CardContent>
                      <Typography variant="h6" component="div" align="left">
                          Billing
                        </Typography>
                        <Typography variant="caption" component="div" align="left">
                          1. Update/ Add payment method.<br />
                          2. Show past invoices to download<br />
                          3. Show link to pay any current unpaid invoice<br />
                          4. Edit Billing Preferences: Company Name, Purchase <br />
                          Order Number, Billing email, Primary Business address, <br />
                          Business Tax ID
                        </Typography>
                      </CardContent>
                    </Card>
                  </Item>
                </Grid>
              </Grid>
              </div>

              {/* <div className="">
              <Grid container >
                <Grid item sm={4} marginTop={10}>
                  <Item>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div" align="left">
                          Profile
                        </Typography>
                        <Typography variant="caption" component="div" align="left">
                          1. Clerk User profile - account name, user id, email, password reset<br />
                          2. EMRs profile account<br />
                          2. Delete account<br />
                        </Typography>
                      </CardContent>
                    </Card>
                  </Item>
                </Grid>
                <Grid item sm={4} marginTop={10} marginLeft={5}>
                    <Item>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" component="div" align="left">
                            Upsell/ Affiliate
                          </Typography>
                          <Typography variant="caption" component="div" align="left">
                            1. Referral code : Refer and earn usage credit<br />
                            2. Add testimonial and earn usage credits<br />
                          </Typography>
                        </CardContent>
                      </Card>
                    </Item>
                  </Grid>
                </Grid>
              </div> */}
          </div>

          </Layout>
        </div>
      </SignedIn>
      <SignedOut>
        <div>
          <Hero />
        </div>
      </SignedOut>
    </>
  );
}
